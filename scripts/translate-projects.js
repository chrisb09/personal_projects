const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =====================================================================
// Paths Configuration
// =====================================================================
const projectsDir = path.join(__dirname, '../config/projects');
const srcLocalesDePath = path.join(__dirname, '../src/locales/de/projects.json');
const publicLocalesDePath = path.join(__dirname, '../public/locales/de/projects.json');
const configDeCatalogPath = path.join(__dirname, '../config/projects-de.json');

// Persistent cache paths (container volume first, then host fallback)
const possibleCacheDirs = [
  '/app/data/translations',
  '/container/data/personal_projects/translations',
  path.join(__dirname, '../data/translations'),
];

// Env secrets paths (never logged or committed)
const possibleEnvPaths = [
  process.env.AI_ENV_PATH,
  '/run/secrets/ai.env',
  '/scripts/ai.env',
  path.join(__dirname, '../ai.env'),
].filter(Boolean);

// Command line arguments
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const isDryRun = args.includes('--dry-run');

// =====================================================================
// Helper: Resolve Persistent Cache File
// =====================================================================
function resolveCachePath() {
  for (const dir of possibleCacheDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write permission
      const testFile = path.join(dir, '.write-test');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return path.join(dir, 'cache.json');
    } catch {
      // Try next
    }
  }
  return path.join(__dirname, '../public/translations-cache.json');
}

// =====================================================================
// Helper: Load AI Environment File Securely in Memory
// =====================================================================
function loadAiEnv() {
  let envContent = null;
  let loadedFrom = null;

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
        loadedFrom = envPath;
        break;
      } catch (err) {
        // Skip unreadable
      }
    }
  }

  if (!envContent) {
    console.log('[Translate] Notice: No AI env file found. Checked: /run/secrets/ai.env, /scripts/ai.env. Skipping AI translation.');
    return null;
  }

  const env = {};
  const lines = envContent.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }

  console.log(`[Translate] Loaded AI configuration from ${loadedFrom} (credentials kept in memory).`);
  return env;
}

// =====================================================================
// Helper: Parse Rate Limits & Token Limits with Units
// =====================================================================
function parseUnit(str) {
  if (!str) return 0;
  const s = str.trim().toLowerCase();
  if (s === 'unlimited' || s === 'unbegrenzt' || s === 'inf' || s === 'infinity') {
    return Infinity;
  }
  const match = s.match(/^([\d.]+)\s*([km])?$/);
  if (match) {
    let val = parseFloat(match[1]);
    const unit = match[2];
    if (unit === 'k') val *= 1000;
    if (unit === 'm') val *= 1000000;
    return Math.round(val);
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

// =====================================================================
// Build Priority Model Queue & Multi-Account Key Pool
// =====================================================================
function buildModelQueue(env) {
  const rawKeys = env.GEMINI_API_KEYS || '';
  const apiKeys = rawKeys.split(',').map(s => s.trim()).filter(Boolean);
  if (apiKeys.length === 0) {
    console.warn('[Translate] Warning: No API keys found in GEMINI_API_KEYS.');
    return null;
  }

  const modelIds = (env.GEMINI_MODEL_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const rpms = (env.GEMINI_RPMS || '').split(',').map(s => s.trim()).filter(Boolean).map(parseUnit);
  const tpms = (env.GEMINI_TPMS || '').split(',').map(s => s.trim()).filter(Boolean).map(parseUnit);
  const rpds = (env.GEMINI_RPDS || '').split(',').map(s => s.trim()).filter(Boolean).map(parseUnit);
  const capabilities = (env.GEMINI_CAPABILITIES || '').split(',').map(s => s.trim()).filter(Boolean).map(s => parseInt(s, 10));

  const count = modelIds.length;
  if (count === 0 || rpms.length !== count || tpms.length !== count || rpds.length !== count || capabilities.length !== count) {
    console.error(`[Translate] Configuration mismatch: parallel lists must have equal lengths. models=${count}, rpms=${rpms.length}, tpms=${tpms.length}, rpds=${rpds.length}, capabilities=${capabilities.length}`);
    return null;
  }

  const models = modelIds.map((id, index) => ({
    id,
    originalIndex: index,
    rpm: rpms[index],
    tpm: tpms[index],
    rpd: rpds[index],
    capability: capabilities[index],
  }));

  // Sort descending by capability, ties broken by original order in GEMINI_MODEL_IDS
  models.sort((a, b) => {
    if (b.capability !== a.capability) {
      return b.capability - a.capability;
    }
    return a.originalIndex - b.originalIndex;
  });

  console.log(`[Translate] Model priority queue (capability-based):`);
  models.forEach((m, rank) => {
    console.log(`  ${rank + 1}. ${m.id} (capability: ${m.capability}, RPM: ${m.rpm}, TPM: ${m.tpm}, RPD: ${m.rpd})`);
  });
  console.log(`[Translate] Key pool: ${apiKeys.length} API key(s) configured for multi-account rotation.`);

  return { models, apiKeys };
}

// =====================================================================
// Quota & Rate Limit State Manager
// =====================================================================
class QuotaTracker {
  constructor(apiKeys, models) {
    this.apiKeys = apiKeys;
    this.models = models;
    this.lastUsedKeyIdx = -1;

    // keyIndex -> { requestsInWindow: number[], estimatedTokensInWindow: number[], requestsToday: number, todayDateStr: string }
    this.keyState = new Map();
    // (modelId + ':' + keyIndex) -> cooldownUntil timestamp
    this.cooldowns = new Map();

    const todayStr = new Date().toISOString().slice(0, 10);
    apiKeys.forEach((_, idx) => {
      this.keyState.set(idx, {
        requestsInWindow: [],
        estimatedTokensInWindow: [],
        requestsToday: 0,
        todayDateStr: todayStr,
      });
    });
  }

  _cleanOldRequests(state, now) {
    const windowStart = now - 60000;
    while (state.requestsInWindow.length > 0 && state.requestsInWindow[0] < windowStart) {
      state.requestsInWindow.shift();
      state.estimatedTokensInWindow.shift();
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (state.todayDateStr !== todayStr) {
      state.todayDateStr = todayStr;
      state.requestsToday = 0;
    }
  }

  selectModelAndKey(estimatedTokens) {
    const now = Date.now();

    for (const model of this.models) {
      for (let k = 0; k < this.apiKeys.length; k++) {
        const keyIdx = (this.lastUsedKeyIdx + 1 + k) % this.apiKeys.length;
        const cooldownKey = `${model.id}:${keyIdx}`;
        const cooldownUntil = this.cooldowns.get(cooldownKey) || 0;

        if (now < cooldownUntil) {
          continue;
        }

        const state = this.keyState.get(keyIdx);
        this._cleanOldRequests(state, now);

        const currentTokens = state.estimatedTokensInWindow.reduce((a, b) => a + b, 0);

        if (state.requestsInWindow.length >= model.rpm) {
          continue;
        }
        if (currentTokens + estimatedTokens > model.tpm) {
          continue;
        }
        if (state.requestsToday >= model.rpd) {
          continue;
        }

        // Available!
        this.lastUsedKeyIdx = keyIdx;
        return {
          model,
          key: this.apiKeys[keyIdx],
          keyIdx,
          release: (success, isQuotaError, retryAfterSec) => {
            if (success) {
              state.requestsInWindow.push(Date.now());
              state.estimatedTokensInWindow.push(estimatedTokens);
              state.requestsToday += 1;
            } else if (isQuotaError) {
              const cooldownMs = (retryAfterSec ? retryAfterSec * 1000 : 60000);
              this.cooldowns.set(cooldownKey, Date.now() + cooldownMs);
              console.warn(`[Translate] Rate limit / quota hit on ${model.id} (key #${keyIdx + 1}). Cooldown for ${Math.round(cooldownMs / 1000)}s. Falling back to next key/model.`);
            }
          }
        };
      }
    }

    return null;
  }
}

// =====================================================================
// Helper: Extract Translatable Payload from project.json
// =====================================================================
function extractTranslatablePayload(data) {
  const payload = {
    name: data.name || '',
    tagline: data.tagline || '',
    description: data.description || '',
    purpose: data.purpose || '',
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    limitations: Array.isArray(data.limitations) ? data.limitations : [],
    expertise: Array.isArray(data.expertise) ? data.expertise : [],
    roadmap: Array.isArray(data.roadmap) ? data.roadmap : [],
  };

  if (Array.isArray(data.relatedProjects) && data.relatedProjects.length > 0) {
    payload.relatedProjects = data.relatedProjects.map((r, i) => ({
      index: i,
      relation: r.relation || '',
    }));
  }

  if (Array.isArray(data.repos) && data.repos.length > 0) {
    payload.repos = data.repos.map((r, i) => ({
      index: i,
      description: r.description || '',
    }));
  }

  if (Array.isArray(data.mirrors) && data.mirrors.length > 0) {
    payload.mirrors = data.mirrors.map((m, i) => ({
      index: i,
      description: m.description || '',
    }));
  }

  if (Array.isArray(data.modelReleases) && data.modelReleases.length > 0) {
    payload.modelReleases = data.modelReleases.map((m, i) => ({
      index: i,
      description: m.description || '',
    }));
  }

  return payload;
}

// Compute deterministic SHA-256 hash of payload
function computePayloadHash(payload) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

// =====================================================================
// AI Translation Requester
// =====================================================================
async function translateProjectWithAi(quotaTracker, projectId, payload) {
  const prompt = `You are a professional software engineering translator specializing in systems programming, developer tools, and machine learning.
Translate the following JSON object representing software project metadata from English to natural, idiomatic, high-quality German.

STRICT TRANSLATION RULES:
1. "name": If the name is a descriptive title (e.g. "Private Homeserver" -> "Privater Homeserver", "Small Projects & Scripts" -> "Kleine Projekte & Skripte"), translate it. If it is a proper name, project code, tool identifier, CLI name, repository identifier, or brand name (e.g. "firecord", "pdnwebview", "pacstall-programs", "opencode-antigravity-auth", "Minecraft Chat Translator", "libretranslate-java", "CPP-ML-Interface", "Userbenchmark Web Scraper"), keep it EXACTLY as-is.
2. Translate "tagline", "description", "purpose", "strengths", "limitations", "expertise", "roadmap", and any item relations or descriptions into natural German.
3. NEVER translate technical identifiers, libraries, frameworks, programming languages, protocols, hardware terms, or code snippets (e.g. "AspectJ", "Redis", "Docker", "FastAPI", "KV cache", "LoRA", "TTFT", "Qwen2.5", "OAuth 2.0", "Zod", "Vitest", "Sub-50ms-Tick").
4. Preserve all Markdown formatting, backticks (\`code\`), bullet points, and newlines exactly as in the input.
5. Return ONLY a valid JSON object matching the input structure exactly. No conversational text, no markdown code fence blocks.

Input JSON to translate:
${JSON.stringify(payload, null, 2)}`;

  const estimatedTokens = Math.ceil(prompt.length / 3) + 300;
  const maxAttempts = quotaTracker.models.length * quotaTracker.apiKeys.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const lease = quotaTracker.selectModelAndKey(estimatedTokens);
    if (!lease) {
      // Wait briefly if all keys are currently rate-limited in the current minute window
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    const { model, key, keyIdx, release } = lease;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent?key=${encodeURIComponent(key)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const retrySec = retryAfter ? parseInt(retryAfter, 10) : 60;
        release(false, true, retrySec);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Translate] API error on ${model.id} (HTTP ${response.status}): ${errText.slice(0, 150)}`);
        release(false, false);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Clean possible markdown code fence
      let cleanedText = rawText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      const parsed = JSON.parse(cleanedText);
      release(true, false);
      return { translation: parsed, modelUsed: model.id };
    } catch (err) {
      console.warn(`[Translate] Network or parsing error with model ${model.id}:`, err.message);
      release(false, false);
    }
  }

  throw new Error(`Exhausted all available models and API keys for project: ${projectId}`);
}

// =====================================================================
// Main Translation Pipeline
// =====================================================================
async function main() {
  console.log('[Translate] Starting project translation pipeline...');

  if (!fs.existsSync(projectsDir)) {
    console.log(`[Translate] Projects directory not found at ${projectsDir}. Skipping.`);
    return;
  }

  // 1. Load persistent cache
  const cachePath = resolveCachePath();
  let cache = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`[Translate] Loaded translation cache with ${Object.keys(cache).length} project entries from ${cachePath}`);
    } catch (err) {
      console.warn(`[Translate] Could not parse cache file at ${cachePath}. Starting fresh cache.`);
      cache = {};
    }
  }

  // 2. Discover all project.json files and determine which need translation
  const projectFolders = fs.readdirSync(projectsDir).filter(item => {
    const itemPath = path.join(projectsDir, item);
    return fs.statSync(itemPath).isDirectory() && fs.existsSync(path.join(itemPath, 'project.json'));
  });

  const translationQueue = [];
  const finalCatalog = {};

  // Pre-seed catalog with existing German translations if file exists
  if (fs.existsSync(srcLocalesDePath)) {
    try {
      const existingDe = JSON.parse(fs.readFileSync(srcLocalesDePath, 'utf8'));
      Object.assign(finalCatalog, existingDe);
    } catch {}
  }

  for (const projectId of projectFolders) {
    const jsonPath = path.join(projectsDir, projectId, 'project.json');
    const projectData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const payload = extractTranslatablePayload(projectData);
    const hash = computePayloadHash(payload);

    const cached = cache[projectId];
    if (!isForce && cached && cached.hash === hash && cached.translation) {
      // Cache hit!
      finalCatalog[projectId] = cached.translation;
    } else {
      // Needs translation
      translationQueue.push({ projectId, payload, hash });
    }
  }

  console.log(`[Translate] Projects status: ${projectFolders.length - translationQueue.length} cached / up-to-date, ${translationQueue.length} require translation.`);

  // 3. If nothing needs translation, write catalog and exit cleanly
  if (translationQueue.length === 0) {
    console.log('[Translate] All project translations are up-to-date with cache.');
    saveCatalogs(finalCatalog, cache, cachePath);
    return;
  }

  if (isDryRun) {
    console.log('[Translate] Dry run complete. Translation skipped.');
    return;
  }

  // 4. Load AI config
  const aiEnv = loadAiEnv();
  if (!aiEnv) {
    console.log('[Translate] AI environment not available. Proceeding with existing translations without blocking.');
    saveCatalogs(finalCatalog, cache, cachePath);
    return;
  }

  const pool = buildModelQueue(aiEnv);
  if (!pool) {
    console.warn('[Translate] Could not initialize model pool. Proceeding with existing translations.');
    saveCatalogs(finalCatalog, cache, cachePath);
    return;
  }

  const tracker = new QuotaTracker(pool.apiKeys, pool.models);

  // 5. Translate each queued project
  let translatedCount = 0;
  for (const item of translationQueue) {
    console.log(`[Translate] Translating ${item.projectId}...`);
    try {
      const { translation, modelUsed } = await translateProjectWithAi(tracker, item.projectId, item.payload);
      
      // Update cache
      cache[item.projectId] = {
        hash: item.hash,
        translation,
        translatedAt: new Date().toISOString(),
        model: modelUsed,
        language: 'de',
      };

      finalCatalog[item.projectId] = translation;
      translatedCount++;
      console.log(`[Translate] ✓ ${item.projectId} translated successfully with ${modelUsed}.`);
      // Save incrementally
      saveCatalogs(finalCatalog, cache, cachePath);
    } catch (err) {
      console.error(`[Translate] ✗ Failed to translate ${item.projectId}:`, err.message);
      // If we already have an older translation in catalog, keep it
      if (cache[item.projectId]?.translation) {
        finalCatalog[item.projectId] = cache[item.projectId].translation;
      }
    }
  }

  console.log(`[Translate] Finished translating ${translatedCount}/${translationQueue.length} projects.`);

  // 6. Save updated cache and catalogs
  saveCatalogs(finalCatalog, cache, cachePath);
}

// =====================================================================
// Helper: Save Catalogs & Cache to Disk Atomically
// =====================================================================
function saveCatalogs(finalCatalog, cache, cachePath) {
  try {
    // 1. Save translation cache
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`[Translate] Saved translation cache to ${cachePath}`);
  } catch (err) {
    console.warn(`[Translate] Could not write cache to ${cachePath}:`, err.message);
  }

  // 2. Save src/locales/de/projects.json
  try {
    fs.mkdirSync(path.dirname(srcLocalesDePath), { recursive: true });
    fs.writeFileSync(srcLocalesDePath, JSON.stringify(finalCatalog, null, 2), 'utf8');
    console.log(`[Translate] Updated ${srcLocalesDePath}`);
  } catch (err) {
    console.warn(`[Translate] Could not write ${srcLocalesDePath}:`, err.message);
  }

  // 3. Save public/locales/de/projects.json
  try {
    fs.mkdirSync(path.dirname(publicLocalesDePath), { recursive: true });
    fs.writeFileSync(publicLocalesDePath, JSON.stringify(finalCatalog, null, 2), 'utf8');
    console.log(`[Translate] Updated ${publicLocalesDePath}`);
  } catch (err) {
    console.warn(`[Translate] Could not write ${publicLocalesDePath}:`, err.message);
  }

  // 4. Save to host config directory if mounted or accessible
  try {
    fs.mkdirSync(path.dirname(configDeCatalogPath), { recursive: true });
    fs.writeFileSync(configDeCatalogPath, JSON.stringify(finalCatalog, null, 2), 'utf8');
  } catch {}

  const hostConfigDePath = '/container/config/personal_projects/config/projects-de.json';
  try {
    if (fs.existsSync(path.dirname(hostConfigDePath))) {
      fs.writeFileSync(hostConfigDePath, JSON.stringify(finalCatalog, null, 2), 'utf8');
      console.log(`[Translate] Synced to ${hostConfigDePath}`);
    }
  } catch {}
}

main().catch(err => {
  console.error('[Translate] Unexpected error in translation runner:', err);
  process.exit(0); // Exit cleanly so build is never broken
});
