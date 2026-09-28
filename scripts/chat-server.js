const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { execFileSync } = require('child_process');

// =====================================================================
// Configuration & Path Resolution
// =====================================================================
const PORT = parseInt(process.env.CHAT_PORT || '3001', 10);
const HOST = process.env.CHAT_HOST || '0.0.0.0';

const possibleEnvPaths = [
  process.env.AI_ENV_PATH,
  '/run/secrets/ai.env',
  '/scripts/ai.env',
  path.join(__dirname, '../ai.env'),
].filter(Boolean);

const possibleConfigDirs = [
  '/app/config',
  '/container/config/personal_projects/config',
  path.join(__dirname, '../config'),
];

const possibleRepoDirs = [
  '/app/repos',
  '/container/data/personal_projects/repos',
  path.join(__dirname, '../repos'),
];

const possibleExtraRepoDirs = [
  '/app/extra-repos',
  '/container/compose/personal_projects/extra-repos',
  path.join(__dirname, '../extra-repos'),
  '/data/backups',
];

const possibleContextDirs = [
  '/app/context',
  '/container/data/personal_projects/context',
  path.join(__dirname, '../context'),
];

const possibleSummaryDirs = [
  '/app/data/repo-summaries',
  '/container/compose/personal_projects/data/repo-summaries',
  path.join(__dirname, '../data/repo-summaries'),
];

const possibleStateDirs = [
  '/app/data',
  path.join(__dirname, '../data'),
  '/tmp',
];

function resolveFirstExisting(candidates) {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c;
    }
  }
  return candidates[candidates.length - 1];
}

const configDir = resolveFirstExisting(possibleConfigDirs);
const repoDir = resolveFirstExisting(possibleRepoDirs);
const extraRepoDir = resolveFirstExisting(possibleExtraRepoDirs);
const contextDir = resolveFirstExisting(possibleContextDirs);
const repoSummariesDir = resolveFirstExisting(possibleSummaryDirs);
const stateDir = resolveFirstExisting(possibleStateDirs);

if (!fs.existsSync(stateDir)) {
  try {
    fs.mkdirSync(stateDir, { recursive: true });
  } catch {
    // Ignore error
  }
}
const quotaStateFile = path.join(stateDir, 'chat-quota-state.json');

console.log('[ChatServer] Resolved base paths:');
console.log(`  Config:     ${configDir}`);
console.log(`  Repos:      ${repoDir}`);
console.log(`  ExtraRepos: ${extraRepoDir}`);
console.log(`  Context:    ${contextDir}`);
console.log(`  Summaries:  ${repoSummariesDir}`);
console.log(`  StateDir:   ${stateDir}`);

// =====================================================================
// AI Environment Loader (Never prints keys)
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

function loadAiEnv() {
  let envContent = null;
  let loadedFrom = null;

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
        loadedFrom = envPath;
        break;
      } catch {
        // Skip unreadable
      }
    }
  }

  if (!envContent) {
    console.warn('[ChatServer] Notice: No AI env file found. Checked:', possibleEnvPaths.join(', '));
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

  console.log(`[ChatServer] Loaded AI credentials from ${loadedFrom} (in-memory only).`);
  return env;
}

// =====================================================================
// Quota Manager & Multi-Key Round-Robin with Proactive Degradation
// =====================================================================
class ChatQuotaTracker {
  constructor(apiKeys, models) {
    this.apiKeys = apiKeys;
    this.models = models;
    this.lastUsedKeyIdx = -1;

    // Per-key usage state: keyIdx -> { requestsInWindow: [], estimatedTokensInWindow: [], requestsToday: 0, todayDateStr: string }
    this.keyState = new Map();
    // Cooldown tracker: `${modelId}:${keyIdx}` -> timestamp
    this.cooldowns = new Map();

    const todayStr = new Date().toISOString().slice(0, 10);
    this.apiKeys.forEach((_, idx) => {
      this.keyState.set(idx, {
        requestsInWindow: [],
        estimatedTokensInWindow: [],
        requestsToday: 0,
        todayDateStr: todayStr,
      });
    });

    this._loadPersistedState();
  }

  _loadPersistedState() {
    try {
      if (fs.existsSync(quotaStateFile)) {
        const raw = fs.readFileSync(quotaStateFile, 'utf8');
        const data = JSON.parse(raw);
        const todayStr = new Date().toISOString().slice(0, 10);
        if (data && data.date === todayStr && Array.isArray(data.keys)) {
          data.keys.forEach((kData, idx) => {
            if (this.keyState.has(idx)) {
              const state = this.keyState.get(idx);
              state.requestsToday = kData.requestsToday || 0;
            }
          });
          console.log(`[ChatServer] Loaded persisted quota state for ${todayStr}. Total requests today: ${data.keys.map(k => k.requestsToday || 0).join(', ')}`);
        }
      }
    } catch (err) {
      console.warn('[ChatServer] Failed to load quota state:', err.message);
    }
  }

  saveState() {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const keysData = [];
      this.keyState.forEach((state, idx) => {
        keysData.push({
          keyIdx: idx,
          requestsToday: state.requestsToday,
        });
      });
      fs.writeFileSync(quotaStateFile, JSON.stringify({ date: todayStr, keys: keysData, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ChatServer] Failed to save quota state:', err.message);
    }
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

  /**
   * Selects model and key with multi-key round-robin & proactive degradation.
   * If a high-tier model's usage reaches >= 75% of its daily limit, it automatically
   * degrades to the next tier (e.g. gemini-3.5-flash-lite with 500 RPD).
   */
  selectModelAndKey(estimatedTokens = 1000) {
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

        // RPM Check
        if (state.requestsInWindow.length >= model.rpm) {
          continue;
        }
        // TPM Check
        if (currentTokens + estimatedTokens > model.tpm) {
          continue;
        }
        // Daily Limit Check
        if (state.requestsToday >= model.rpd) {
          continue;
        }

        // Proactive Degradation Rule:
        // If this model has low RPD (<= 50) and the key has already consumed >= 75% of it today,
        // degrade to a higher-quota model to prevent quota exhaustion.
        if (model.rpd <= 50 && state.requestsToday >= Math.floor(model.rpd * 0.75)) {
          continue; // Move down to next model tier
        }

        // Selected!
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
              this.saveState();
            } else if (isQuotaError) {
              const cooldownMs = (retryAfterSec ? retryAfterSec * 1000 : 60000);
              this.cooldowns.set(cooldownKey, Date.now() + cooldownMs);
              console.warn(`[ChatServer] Rate limit/cooldown on ${model.id} (key #${keyIdx + 1}) for ${Math.round(cooldownMs / 1000)}s.`);
            }
          }
        };
      }
    }

    return null;
  }
}

function initQuotaTracker() {
  const env = loadAiEnv();
  if (!env) return null;

  const rawKeys = env.GEMINI_API_KEYS || '';
  const apiKeys = rawKeys.split(',').map(s => s.trim()).filter(Boolean);
  if (apiKeys.length === 0) {
    console.warn('[ChatServer] Warning: GEMINI_API_KEYS is empty.');
    return null;
  }

  const modelIds = (env.GEMINI_MODEL_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const rpms = (env.GEMINI_RPMS || '').split(',').map(s => s.trim()).filter(Boolean).map(parseUnit);
  const tpms = (env.GEMINI_TPMS || '').split(',').map(s => s.trim()).filter(Boolean).map(parseUnit);
  const rpds = (env.GEMINI_RPDS || '').split(',').map(s => s.trim()).filter(Boolean).map(parseUnit);
  const capabilities = (env.GEMINI_CAPABILITIES || '').split(',').map(s => s.trim()).filter(Boolean).map(s => parseInt(s, 10));

  const count = modelIds.length;
  const models = [];
  for (let i = 0; i < count; i++) {
    // Only register models that are Gemini API models (exclude gemma and models with known endpoint issues)
    const id = modelIds[i];
    if (id.startsWith('gemma-') || id === 'gemini-3.7-flash') continue;
    models.push({
      id,
      originalIndex: i,
      rpm: rpms[i] || 15,
      tpm: tpms[i] || 250000,
      rpd: rpds[i] || 500,
      capability: capabilities[i] || 5,
    });
  }

  // Prioritize fast, reliable models: gemini-3.6-flash and gemini-3.5-flash-lite
  models.sort((a, b) => {
    const scoreA = a.id === 'gemini-3.6-flash' ? 100 : a.id === 'gemini-3.5-flash-lite' ? 90 : a.capability;
    const scoreB = b.id === 'gemini-3.6-flash' ? 100 : b.id === 'gemini-3.5-flash-lite' ? 90 : b.capability;
    return scoreB - scoreA;
  });

  console.log(`[ChatServer] Initialized QuotaTracker with ${apiKeys.length} keys and ${models.length} active models:`);
  models.forEach((m, i) => console.log(`  ${i + 1}. ${m.id} (Cap: ${m.capability}, RPM: ${m.rpm}, RPD: ${m.rpd})`));

  return new ChatQuotaTracker(apiKeys, models);
}

const loadedEnv = loadAiEnv();
const quotaTracker = initQuotaTracker();
const PRIMARY_PROVIDER = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase().trim();

// OpenRouter Configuration (Luna 6, High Effort)
const openrouterKey = (loadedEnv?.OPENROUTER_API_KEYS || '').split(',')[0].trim();
const openrouterModel = (loadedEnv?.OPENROUTER_MODEL_IDS || 'gpt-6-luna').split(',')[0].trim();
const openrouterConfigured = Boolean(openrouterKey);

// Cerebras Configuration
const cerebrasKey = loadedEnv?.CEREBRAS_API_KEY || '';
const cerebrasModel = (loadedEnv?.CEREBRAS_MODEL_IDS || 'qwen-3.8-27b').split(',')[0].trim();
const cerebrasConfigured = Boolean(cerebrasKey);

console.log(`[ChatServer] Hierarchy: OpenRouter (${openrouterConfigured ? openrouterModel : 'disabled'}) -> Gemini (${Boolean(quotaTracker)}) -> Cerebras (${cerebrasConfigured ? cerebrasModel : 'disabled'})`);
console.log(`[ChatServer] Primary Provider: ${PRIMARY_PROVIDER}`);

// =====================================================================
// Client-Side IP Rate Limiting (Abuse prevention)
// =====================================================================
const clientIpMap = new Map(); // ip -> { requests: number[], dayCount: number, dayDateStr: string }

function isClientAllowed(ip) {
  const now = Date.now();
  const windowStart = now - 60000;
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!clientIpMap.has(ip)) {
    clientIpMap.set(ip, { requests: [now], dayCount: 1, dayDateStr: todayStr });
    return true;
  }

  const record = clientIpMap.get(ip);
  if (record.dayDateStr !== todayStr) {
    record.dayDateStr = todayStr;
    record.dayCount = 0;
  }

  record.requests = record.requests.filter(t => t > windowStart);

  // Limits: max 15 requests per minute, max 75 per day per IP
  if (record.requests.length >= 15 || record.dayCount >= 75) {
    return false;
  }

  record.requests.push(now);
  record.dayCount += 1;
  return true;
}

// Clean up old IP records every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 3600000;
  for (const [ip, record] of clientIpMap.entries()) {
    if (record.requests.length === 0 || Math.max(...record.requests) < cutoff) {
      clientIpMap.delete(ip);
    }
  }
}, 1800000);

// =====================================================================
// Read-Only Tools Implementation & Security Sandboxing
// =====================================================================

// Forbidden patterns in filenames / paths
const FORBIDDEN_PATTERNS = [
  /^\.env/i,
  /\.env$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.git\/config/i,
  /\.ssh/i,
  /key/i,
  /secret/i,
  /token/i,
  /\.(pem|crt|key|p12|pfx)$/i,
  /\.(png|jpe?g|gif|webp|ico|svg|bmp|tiff)$/i,
  /\.(zip|tar|gz|bz2|xz|7z|rar|jar|war)$/i,
  /\.(exe|so|dylib|dll|bin|o|a|class|pyc)$/i,
];

function isSafeFilePath(relPath) {
  if (!relPath || typeof relPath !== 'string') return false;
  if (relPath.includes('..') || path.isAbsolute(relPath)) return false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(relPath)) return false;
  }
  return true;
}

// Cached Projects Data
let cachedProjectsSummary = null;
function getProjectsSummary() {
  if (cachedProjectsSummary) return cachedProjectsSummary;

  const projects = [];
  const projectsPath = path.join(configDir, 'projects');
  if (fs.existsSync(projectsPath)) {
    const entries = fs.readdirSync(projectsPath, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const pFile = path.join(projectsPath, ent.name, 'project.json');
        if (fs.existsSync(pFile)) {
          try {
            const data = JSON.parse(fs.readFileSync(pFile, 'utf8'));
            projects.push({
              id: data.id || ent.name,
              name: data.name || ent.name,
              category: data.category || '',
              role: data.role || '',
              year: data.year || '',
              tagline: data.tagline || '',
              description: (data.description || '').slice(0, 200),
              techStack: (data.techStack || []).slice(0, 15),
              status: data.status || '',
              aiUsage: data.aiUsage || '',
            });
          } catch {
            // Ignore malformed files
          }
        }
      }
    }
  }
  cachedProjectsSummary = projects;
  return projects;
}

// Available Tool Declarations for Gemini
const TOOL_DECLARATIONS = [
  {
    name: 'list_projects',
    description: 'Lists all portfolio projects with their ID, name, category, role, year, short description, and full techStack (languages & tools). Always use this first to check which projects use specific programming languages (Python, C++, TypeScript, Java, C#, PHP, etc.), tools, or roles.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category to filter projects' }
      }
    }
  },
  {
    name: 'get_project_details',
    description: 'Retrieves complete metadata for a specific project (purpose, strengths, limitations, expertise gained, roadmap, repo links).',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'The project ID (e.g. "cpp-ml-interface", "exam-system-backend", "MusicBot", "opencode-oneprovider")' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_personal_bio',
    description: 'Retrieves Christian F. Brinkmann’s portfolio overview, tagline, professional background highlights, and contact information.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_repo_files',
    description: 'Lists files and folders inside a project git repository up to 2 levels deep.',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository (e.g. "CPP-ML-Interface", "cycling_power_estimator", "pacstall-programs", "smartsim_playground")' },
        subDirectory: { type: 'string', description: 'Optional relative sub-directory within the repo' }
      },
      required: ['repoName']
    }
  },
  {
    name: 'read_repo_file',
    description: 'Reads text content (e.g. README.md, CMakeLists.txt, source code, config files) from a project repository. Output is capped at 150 lines.',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository' },
        filePath: { type: 'string', description: 'Relative path to the text file within the repository' },
        startLine: { type: 'integer', description: 'Start line number (1-indexed, default 1)' },
        lineCount: { type: 'integer', description: 'Number of lines to read (default 50, max 150)' }
      },
      required: ['repoName', 'filePath']
    }
  },
  {
    name: 'search_code',
    description: 'Searches for text or symbols inside repository files, returning up to 5 matching snippets.',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository' },
        searchTerm: { type: 'string', description: 'Search term or symbol name' }
      },
      required: ['repoName', 'searchTerm']
    }
  },
  {
    name: 'read_personal_context',
    description: 'Reads authoritative personal documents, biographical background, career principles, or private notes provided directly by Christian from the context folder. Call without documentName to view the catalog of available personal documents.',
    parameters: {
      type: 'object',
      properties: {
        documentName: { type: 'string', description: 'Optional filename of the document to read (e.g. "bio.md", "career.md", "notes/README.md")' }
      }
    }
  },
  {
    name: 'get_codebase_summary',
    description: 'Retrieves pre-computed architectural and file-by-file summaries for any repository. Use this to quickly see what files exist in a repository and what each file does without having to read raw source code.',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository (e.g. "CPP-ML-Interface", "MusicBot", "cycling_power_estimator", "firecord")' },
        subPath: { type: 'string', description: 'Optional directory or specific file path to focus on' }
      },
      required: ['repoName']
    }
  },
  {
    name: 'get_git_log',
    description: 'Retrieves recent git commits for a repository, including commit hash, date, author name, and commit message. Can optionally filter by author or specific file path.',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository' },
        maxCommits: { type: 'integer', description: 'Number of commits to return (default 10, max 25)' },
        filePath: { type: 'string', description: 'Optional relative path to inspect commit history for a specific file' },
        author: { type: 'string', description: 'Optional author name or email pattern to filter commits' }
      },
      required: ['repoName']
    }
  },
  {
    name: 'get_git_commit_diff',
    description: 'Inspects a specific git commit in a repository, returning the commit message, changed files stat, and the diff/patch (capped at 150 lines).',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository' },
        commitHash: { type: 'string', description: 'The commit hash or ref (e.g. "HEAD", "HEAD~1", or short/full SHA)' },
        filePath: { type: 'string', description: 'Optional specific file to limit the diff to' }
      },
      required: ['repoName', 'commitHash']
    }
  },
  {
    name: 'get_git_contributors',
    description: 'Lists all contributors to a repository with their commit counts, author names, and emails.',
    parameters: {
      type: 'object',
      properties: {
        repoName: { type: 'string', description: 'Name of the repository' }
      },
      required: ['repoName']
    }
  }
];

function findRepoPath(repoName) {
  if (!repoName || typeof repoName !== 'string') return null;
  const cleanName = path.basename(repoName.trim());

  // Check main repos directory
  const directPath = path.join(repoDir, cleanName);
  if (fs.existsSync(directPath)) return directPath;

  // Check case-insensitive match in main repos
  if (fs.existsSync(repoDir)) {
    const list = fs.readdirSync(repoDir);
    const found = list.find(l => l.toLowerCase() === cleanName.toLowerCase());
    if (found) return path.join(repoDir, found);
  }

  // Check extra repos (including smartsim_playground)
  const extraPath = path.join(extraRepoDir, cleanName);
  if (fs.existsSync(extraPath)) return extraPath;

  if (fs.existsSync(extraRepoDir)) {
    const list = fs.readdirSync(extraRepoDir);
    const found = list.find(l => l.toLowerCase() === cleanName.toLowerCase());
    if (found) return path.join(extraRepoDir, found);
  }

  // Check if it's a sub-directory in extra-repos (e.g. smartsim_playground submodules)
  const smartsimDir = path.join(extraRepoDir, 'smartsim_playground');
  if (fs.existsSync(smartsimDir)) {
    const sub = path.join(smartsimDir, cleanName);
    if (fs.existsSync(sub)) return sub;
    try {
      const list = fs.readdirSync(smartsimDir);
      const found = list.find(l => l.toLowerCase() === cleanName.toLowerCase());
      if (found) return path.join(smartsimDir, found);
    } catch {
      // Ignore
    }
  }

  // Check if it's inside low_repos (Minecraft cluster repositories)
  const lowReposDir = path.join(extraRepoDir, 'low_repos');
  if (fs.existsSync(lowReposDir)) {
    const sub = path.join(lowReposDir, cleanName);
    if (fs.existsSync(sub)) return sub;
    try {
      const list = fs.readdirSync(lowReposDir);
      const found = list.find(l => l.toLowerCase() === cleanName.toLowerCase());
      if (found) return path.join(lowReposDir, found);
    } catch {
      // Ignore
    }
  }

  // Direct host fallback for low_repos
  const directLowDir = '/data/backups/low_repos';
  if (fs.existsSync(directLowDir)) {
    const sub = path.join(directLowDir, cleanName);
    if (fs.existsSync(sub)) return sub;
    try {
      const list = fs.readdirSync(directLowDir);
      const found = list.find(l => l.toLowerCase() === cleanName.toLowerCase());
      if (found) return path.join(directLowDir, found);
    } catch {}
  }

  return null;
}

function getRepoUrl(repoOrProjectId) {
  if (!repoOrProjectId) return null;
  const clean = repoOrProjectId.trim().toLowerCase();

  const projectsPath = path.join(configDir, 'projects');
  if (fs.existsSync(projectsPath)) {
    try {
      const dirs = fs.readdirSync(projectsPath);
      for (const d of dirs) {
        const pFile = path.join(projectsPath, d, 'project.json');
        if (fs.existsSync(pFile)) {
          const data = JSON.parse(fs.readFileSync(pFile, 'utf8'));
          if (
            (data.id && data.id.toLowerCase() === clean) ||
            d.toLowerCase() === clean ||
            (data.name && data.name.toLowerCase() === clean) ||
            (Array.isArray(data.repos) && data.repos.some(r => r.name?.toLowerCase() === clean || r.url?.toLowerCase().includes(clean)))
          ) {
            return data.repos?.[0]?.url || `https://github.com/chrisb09/${d}`;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return `https://github.com/chrisb09/${repoOrProjectId}`;
}

const commitHashCache = new Map();

function getRepoCommitHash(repoPath) {
  if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) return 'master';
  if (commitHashCache.has(repoPath)) return commitHashCache.get(repoPath);
  try {
    const hash = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoPath,
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    const finalHash = hash || 'master';
    commitHashCache.set(repoPath, finalHash);
    return finalHash;
  } catch {
    commitHashCache.set(repoPath, 'master');
    return 'master';
  }
}

function getFileUrl(repoName, filePath, startLine, endLine) {
  const repoUrl = getRepoUrl(repoName);
  if (!repoUrl) return null;
  const cleanFile = filePath.replace(/^\/+/, '');
  const repoPath = findRepoPath(repoName);
  const commitHash = repoPath ? getRepoCommitHash(repoPath) : 'master';

  let anchor = '';
  if (startLine) {
    anchor = endLine && endLine !== startLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`;
  }

  if (repoUrl.includes('github.com')) {
    return `${repoUrl.replace(/\.git$/, '')}/blob/${commitHash}/${cleanFile}${anchor}`;
  }
  if (repoUrl.includes('gitlab')) {
    return `${repoUrl.replace(/\.git$/, '')}/-/blob/${commitHash}/${cleanFile}${anchor}`;
  }
  return `${repoUrl}${anchor}`;
}

function getCommitUrl(repoName, commitHash) {
  const repoUrl = getRepoUrl(repoName);
  if (!repoUrl) return null;
  const cleanHash = String(commitHash || '').trim().replace(/[^a-zA-Z0-9_.-]/g, '');
  if (repoUrl.includes('github.com')) {
    return `${repoUrl.replace(/\.git$/, '')}/commit/${cleanHash}`;
  }
  if (repoUrl.includes('gitlab')) {
    return `${repoUrl.replace(/\.git$/, '')}/-/commit/${cleanHash}`;
  }
  return repoUrl;
}

// Tool Execution Dispatcher
async function executeTool(name, args, onSourceFound) {
  try {
    switch (name) {
      case 'list_projects': {
        if (onSourceFound) {
          onSourceFound({ title: 'Projects Catalog', url: 'https://projects.christian-f-brinkmann.de/#projects', type: 'catalog' });
        }
        const list = getProjectsSummary();
        if (args.category) {
          const cat = args.category.toLowerCase();
          return { projects: list.filter(p => p.category.toLowerCase().includes(cat)) };
        }
        return { count: list.length, projects: list };
      }

      case 'get_project_details': {
        const projectId = (args.projectId || '').trim();
        const pFile = path.join(configDir, 'projects', projectId, 'project.json');
        let data = null;
        if (!fs.existsSync(pFile)) {
          // Try case-insensitive lookup
          const pDir = path.join(configDir, 'projects');
          if (fs.existsSync(pDir)) {
            const list = fs.readdirSync(pDir);
            const found = list.find(d => d.toLowerCase() === projectId.toLowerCase());
            if (found) {
              const altFile = path.join(pDir, found, 'project.json');
              data = JSON.parse(fs.readFileSync(altFile, 'utf8'));
            }
          }
        } else {
          data = JSON.parse(fs.readFileSync(pFile, 'utf8'));
        }

        if (!data) {
          return { error: `Project '${projectId}' not found.` };
        }

        if (onSourceFound) {
          const sourceUrl = data.repos?.[0]?.url || getRepoUrl(projectId);
          onSourceFound({ title: data.name || projectId, url: sourceUrl, type: 'project' });
        }

        return data;
      }

      case 'get_personal_bio': {
        if (onSourceFound) {
          onSourceFound({ title: 'Christian F. Brinkmann Profile', url: 'https://projects.christian-f-brinkmann.de/', type: 'profile' });
        }
        const headerFile = path.join(configDir, 'portfolio-header.json');
        if (fs.existsSync(headerFile)) {
          return JSON.parse(fs.readFileSync(headerFile, 'utf8'));
        }
        return { bio: 'Christian F. Brinkmann - Software Engineer specializing in backend systems, developer tooling, and applied machine learning.' };
      }

      case 'list_repo_files': {
        const repoPath = findRepoPath(args.repoName);
        if (!repoPath) return { error: `Repository '${args.repoName}' not found.` };

        let targetDir = repoPath;
        if (args.subDirectory) {
          if (!isSafeFilePath(args.subDirectory)) return { error: 'Invalid or disallowed subDirectory path.' };
          targetDir = path.join(repoPath, args.subDirectory);
        }

        if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
          return { error: 'Target directory does not exist.' };
        }

        if (onSourceFound) {
          onSourceFound({ title: `Repo: ${args.repoName}`, url: getRepoUrl(args.repoName), type: 'repository' });
        }

        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        const results = [];
        for (const ent of entries) {
          if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === '__pycache__' || ent.name === 'dist' || ent.name === 'build') {
            continue;
          }
          if (results.length >= 50) break;
          results.push({
            name: ent.name,
            type: ent.isDirectory() ? 'directory' : 'file',
          });
        }
        return { repository: args.repoName, directory: args.subDirectory || '/', entries: results };
      }

      case 'read_repo_file': {
        const repoPath = findRepoPath(args.repoName);
        if (!repoPath) return { error: `Repository '${args.repoName}' not found.` };
        if (!isSafeFilePath(args.filePath)) return { error: `Access to '${args.filePath}' is restricted or disallowed.` };

        const fullPath = path.join(repoPath, args.filePath);
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
          return { error: `File '${args.filePath}' does not exist.` };
        }

        const stat = fs.statSync(fullPath);
        if (stat.size > 2000000) { // Reject files > 2MB
          return { error: 'File is too large to read directly.' };
        }

        if (onSourceFound) {
          onSourceFound({ title: `${args.repoName}/${args.filePath}`, url: getFileUrl(args.repoName, args.filePath), type: 'file' });
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const start = Math.max(1, parseInt(args.startLine || '1', 10));
        const limit = Math.min(150, Math.max(1, parseInt(args.lineCount || '50', 10)));
        const sliced = lines.slice(start - 1, start - 1 + limit);
        const end = start + sliced.length - 1;

        if (onSourceFound) {
          const permalink = getFileUrl(args.repoName, args.filePath, start, end);
          onSourceFound({
            title: `${args.repoName}/${args.filePath}#L${start}-L${end}`,
            url: permalink,
            type: 'file',
            lines: `${start}-${end}`
          });
        }

        return {
          repository: args.repoName,
          file: args.filePath,
          totalLines: lines.length,
          startLine: start,
          endLine: end,
          linesReturned: sliced.length,
          content: sliced.join('\n'),
        };
      }

      case 'read_personal_context': {
        if (!contextDir || !fs.existsSync(contextDir)) {
          return { error: 'No personal context directory configured.' };
        }
        if (!args.documentName) {
          const files = [];
          function walkDocs(dir, prefix = '') {
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const e of entries) {
                if (e.name.startsWith('.')) continue;
                const rel = prefix ? `${prefix}/${e.name}` : e.name;
                const full = path.join(dir, e.name);
                if (e.isDirectory()) {
                  walkDocs(full, rel);
                } else if (e.isFile() && /\.(md|txt)$/i.test(e.name)) {
                  const stat = fs.statSync(full);
                  files.push({ name: rel, sizeBytes: stat.size });
                }
              }
            } catch {}
          }
          walkDocs(contextDir);
          if (onSourceFound) {
            onSourceFound({ title: 'Personal Context Documents', url: 'https://projects.christian-f-brinkmann.de/', type: 'context' });
          }
          return { availableDocuments: files, instructions: 'Call read_personal_context with documentName to read any of these documents.' };
        }

        const relDoc = String(args.documentName).trim().replace(/^\/+/, '');
        if (relDoc.includes('..') || path.isAbsolute(relDoc)) {
          return { error: 'Invalid document path.' };
        }
        const fullDocPath = path.join(contextDir, relDoc);
        if (!fs.existsSync(fullDocPath) || !fs.statSync(fullDocPath).isFile()) {
          return { error: `Document '${relDoc}' not found in context.` };
        }
        const text = fs.readFileSync(fullDocPath, 'utf8');
        const lines = text.split('\n');
        const content = lines.slice(0, 200).join('\n');
        if (onSourceFound) {
          onSourceFound({ title: `Context: ${relDoc}`, url: 'https://projects.christian-f-brinkmann.de/', type: 'context' });
        }
        return { document: relDoc, totalLines: lines.length, content };
      }

      case 'get_codebase_summary': {
        const repoName = (args.repoName || '').trim();
        const summaryFile = path.join(repoSummariesDir, `${repoName}.json`);
        if (!fs.existsSync(summaryFile)) {
          if (fs.existsSync(repoSummariesDir)) {
            const list = fs.readdirSync(repoSummariesDir);
            const found = list.find(f => f.toLowerCase() === `${repoName.toLowerCase()}.json`);
            if (found) {
              const data = JSON.parse(fs.readFileSync(path.join(repoSummariesDir, found), 'utf8'));
              if (onSourceFound) {
                onSourceFound({ title: `Architecture Map: ${repoName}`, url: getRepoUrl(repoName), type: 'summary' });
              }
              return data;
            }
          }
          return { error: `No precomputed summary found for '${repoName}'. Use read_repo_file or list_repo_files.` };
        }
        const data = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
        if (onSourceFound) {
          onSourceFound({ title: `Architecture Map: ${repoName}`, url: getRepoUrl(repoName), type: 'summary' });
        }
        return data;
      }

      case 'search_code': {
        const repoPath = findRepoPath(args.repoName);
        if (!repoPath) return { error: `Repository '${args.repoName}' not found.` };
        const query = (args.searchTerm || '').trim().toLowerCase();
        if (!query || query.length < 2) return { error: 'Search term too short.' };

        if (onSourceFound) {
          onSourceFound({ title: `${args.repoName} (code search)`, url: getRepoUrl(args.repoName), type: 'code' });
        }

        const matches = [];
        function walk(currentDir, depth = 0) {
          if (depth > 4 || matches.length >= 5) return;
          try {
            const ents = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const ent of ents) {
              if (matches.length >= 5) break;
              if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'build' || ent.name === 'dist' || ent.name === '__pycache__') continue;
              const p = path.join(currentDir, ent.name);
              if (ent.isDirectory()) {
                walk(p, depth + 1);
              } else if (ent.isFile() && isSafeFilePath(path.relative(repoPath, p))) {
                try {
                  const stat = fs.statSync(p);
                  if (stat.size < 500000) {
                    const text = fs.readFileSync(p, 'utf8');
                    const lines = text.split('\n');
                    for (let idx = 0; idx < lines.length; idx++) {
                      if (lines[idx].toLowerCase().includes(query)) {
                        const rel = path.relative(repoPath, p);
                        matches.push({
                          file: rel,
                          line: idx + 1,
                          snippet: lines[idx].trim().slice(0, 140),
                        });
                        if (matches.length >= 5) break;
                      }
                    }
                  }
                } catch {
                  // Skip unreadable files
                }
              }
            }
          } catch {
            // Skip unreadable directories
          }
        }
        walk(repoPath, 0);
        return { repository: args.repoName, searchTerm: args.searchTerm, matches };
      }

      case 'get_git_log': {
        const repoPath = findRepoPath(args.repoName);
        if (!repoPath) return { error: `Repository '${args.repoName}' not found.` };
        const max = Math.min(25, Math.max(1, parseInt(args.maxCommits || '10', 10)));
        const gitArgs = ['log', `-n`, String(max), '--format=%h%x09%H%x09%cs%x09%an%x09%s'];

        if (args.author) {
          gitArgs.push(`--author=${args.author}`);
        }
        if (args.filePath) {
          if (!isSafeFilePath(args.filePath)) return { error: 'Invalid file path.' };
          gitArgs.push('--', args.filePath);
        }

        try {
          const raw = execFileSync('git', gitArgs, {
            cwd: repoPath,
            timeout: 5000,
            stdio: ['ignore', 'pipe', 'ignore'],
          }).toString().trim();

          const commits = raw ? raw.split('\n').map(line => {
            const [shortHash, fullHash, date, author, subject] = line.split('\t');
            return {
              commit: shortHash,
              date,
              author,
              title: subject,
              url: getCommitUrl(args.repoName, fullHash || shortHash),
            };
          }) : [];

          if (onSourceFound) {
            onSourceFound({
              title: `${args.repoName} Git Log (${commits.length} commits)`,
              url: getRepoUrl(args.repoName) + (getRepoUrl(args.repoName).includes('gitlab') ? '/-/commits/HEAD' : '/commits'),
              type: 'git'
            });
          }

          return { repository: args.repoName, commitsCount: commits.length, commits };
        } catch (err) {
          return { error: `Failed to read git log: ${err.message}` };
        }
      }

      case 'get_git_commit_diff': {
        const repoPath = findRepoPath(args.repoName);
        if (!repoPath) return { error: `Repository '${args.repoName}' not found.` };
        const commitRef = String(args.commitHash || 'HEAD').trim();
        if (!/^[a-zA-Z0-9_~^.-]+$/.test(commitRef)) {
          return { error: 'Invalid commit reference.' };
        }

        try {
          const statRaw = execFileSync('git', ['show', '--stat', '--oneline', commitRef], {
            cwd: repoPath,
            timeout: 5000,
            stdio: ['ignore', 'pipe', 'ignore'],
          }).toString().trim();

          const diffArgs = ['show', '--format=', commitRef];
          if (args.filePath) {
            if (!isSafeFilePath(args.filePath)) return { error: 'Invalid file path.' };
            diffArgs.push('--', args.filePath);
          }

          const patchRaw = execFileSync('git', diffArgs, {
            cwd: repoPath,
            timeout: 5000,
            stdio: ['ignore', 'pipe', 'ignore'],
          }).toString().trim();

          const patchLines = patchRaw.split('\n');
          const maxPatchLines = 150;
          const clampedPatch = patchLines.slice(0, maxPatchLines).join('\n') +
            (patchLines.length > maxPatchLines ? `\n... (truncated, total ${patchLines.length} lines)` : '');

          const commitUrl = getCommitUrl(args.repoName, commitRef);
          if (onSourceFound) {
            onSourceFound({
              title: `Commit ${commitRef.slice(0, 7)}: ${args.repoName}`,
              url: commitUrl,
              type: 'commit'
            });
          }

          return {
            repository: args.repoName,
            commit: commitRef,
            url: commitUrl,
            stat: statRaw.split('\n').slice(0, 15).join('\n'),
            diff: clampedPatch,
          };
        } catch (err) {
          return { error: `Failed to inspect commit: ${err.message}` };
        }
      }

      case 'get_git_contributors': {
        const repoPath = findRepoPath(args.repoName);
        if (!repoPath) return { error: `Repository '${args.repoName}' not found.` };

        try {
          const raw = execFileSync('git', ['shortlog', '-sne', 'HEAD'], {
            cwd: repoPath,
            timeout: 5000,
            stdio: ['ignore', 'pipe', 'ignore'],
          }).toString().trim();

          const contributors = raw ? raw.split('\n').map(line => {
            const match = line.trim().match(/^(\d+)\s+(.+?)\s+<([^>]+)>$/);
            if (match) {
              return { commits: parseInt(match[1], 10), name: match[2], email: match[3] };
            }
            return { raw: line.trim() };
          }) : [];

          if (onSourceFound) {
            onSourceFound({
              title: `Contributors: ${args.repoName}`,
              url: getRepoUrl(args.repoName),
              type: 'git'
            });
          }

          return { repository: args.repoName, totalContributors: contributors.length, contributors };
        } catch (err) {
          return { error: `Failed to read contributors: ${err.message}` };
        }
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: `Failed to execute tool '${name}': ${err.message}` };
  }
}

// =====================================================================
// System Prompt
// =====================================================================
const SYSTEM_PROMPT = `You are Christian F. Brinkmann's Portfolio AI Assistant. You represent Christian and his developer portfolio website.

OBJECTIVE & SKIMMABILITY:
- Extreme Conciseness & Overview-First: The user usually needs a crisp, structured overview first and can ask more if he/she desires. Avoid long narrative paragraphs, conversational filler, or essay-style preambles.
- Structure Over Prose: Use structure itself to make reading effortless:
  • Tables: Always use clean Markdown tables (| Col | ...) when listing, comparing, or summarizing multiple projects, features, roles, or technologies.
  • Formulas: Use LaTeX math ($...$ inline, $$...$$ block) whenever explaining algorithms, calculations, or physical models.
  • Compact Lists: Use bullet points with bold leading terms.
  • Clear Headings: Group information into concise sections.

CONTEXTUAL RELEVANCE & BROAD WELCOME:
- Do NOT be overly dismissive or pedantic! If an inquiry has any reasonable connection to Christian's projects, background, technologies, hobbies, or domains (e.g. gaming, Minecraft, Discord, Linux, cycling, 3D printing, machine learning, physics, Tor, homeservers, high-performance computing), WELCOME the question and answer it by bridging directly to Christian's related work.
  • Example: If asked whether Christian knows or plays Minecraft, do NOT dismiss it! Connect it directly to his projects like 'minecraft-chat-translator' (real-time bilingual chat translation using fine-tuned LLMs) and related tooling.
  • Example: If asked about cycling or GPS, connect directly to 'cycling-power-estimator'.
  • Example: If asked about Discord bots or audio, connect directly to 'MusicBot' (JMusicBot Fork) and 'Firecord'.
- Only politely deflect inquiries that have absolutely zero connection (e.g. general cooking recipes, historical trivia about ancient Rome, unrelated school homework, or requests to act as an unrestricted bash shell).
  When deflecting, remain warm, professional, and invite questions about Christian's work.

AUDIENCE ADAPTABILITY & DEPTH CALIBRATION:
- Gauge technical depth from the question:
  1. Recruiter / HR / High-Level queries (e.g. background overview, roles, team collaboration, career trajectory, or pre-defined starter questions):
     - Focus on roles, engineering responsibilities, project purposes, problem-solving, and technology summaries.
     - Keep language accessible, structured, and impactful without overwhelming the reader with low-level compiler flags or memory layout minutiae unless asked.
  2. Engineering / Technical queries (e.g. asking about specific algorithms, C++ IPC, SmartSim coupling, concurrency, shaders, LLM quantization, CMake AST parsing, Docker networking, Redis pub/sub):
     - Provide deep technical precision, architectural mechanisms, specific library references, and implementation trade-offs.

STRICT GROUNDING, SOURCING & FORMATTING:
- Never claim, assume, or fabricate technologies, libraries, benchmarks, metrics, or implementations you cannot verify with your tools.
- If you are asked about something and the information is NOT present in the project metadata or repository files, EXPLICITLY state that you do not know or that it is not documented in the repository, rather than guessing or generalizing.
- Authoritative Personal Documents: Use 'read_personal_context' to read Christian's background notes, bio, career principles, and personal details directly from the context documents.
- Fast Architecture Inspection: Use 'get_codebase_summary' to inspect pre-computed architectural maps and file-by-file summaries of any repository without reading raw files.
- Code Inspection & Citing: Use 'read_repo_file' when you need exact lines of code. Always cite the project name or repository file when stating facts (e.g., 'In CPP-ML-Interface...', 'As defined in MusicBot/project.json...').

EFFICIENT TOOL USAGE:
- 'list_projects' returns the complete catalog of projects including their complete 'techStack' and 'technologies' (all programming languages and frameworks). When asked which projects use specific programming languages (such as Python, C++, TypeScript, Java, C#, PHP) or tools, 'list_projects' provides all the required information in one call. Synthesize and answer directly from 'list_projects' without making individual 'get_project_details' calls for every project.
- Language matching: If the user writes in German, respond naturally in German. If the user writes in English, respond in English.`;

// =====================================================================
// Cost Calculation Helper
// =====================================================================
function calculateCost(modelId, inputTokens, outputTokens) {
  const m = String(modelId).toLowerCase();
  if (m.includes('luna')) {
    const cost = (inputTokens * 0.50 + outputTokens * 1.50) / 1000000;
    return cost < 0.0001 ? '<$0.0001' : `$${cost.toFixed(4)}`;
  }
  if (m.includes('cerebras') || m.includes('qwen')) {
    const cost = (inputTokens * 0.20 + outputTokens * 0.60) / 1000000;
    return cost < 0.0001 ? '<$0.0001' : `$${cost.toFixed(4)}`;
  }
  return '$0.00 (Free Tier)';
}

function getFriendlyToolName(toolName, toolArgs) {
  switch (toolName) {
    case 'list_projects': return 'Checking projects catalog';
    case 'get_project_details': return `Loading details for ${toolArgs?.projectId || 'project'}`;
    case 'get_personal_bio': return 'Loading bio and background';
    case 'read_repo_file': return `Inspecting ${toolArgs?.filePath || 'code'}`;
    case 'search_code': return `Searching code for "${toolArgs?.searchTerm}"`;
    case 'list_repo_files': return `Listing files in ${toolArgs?.repoName}`;
    case 'read_personal_context': return `Reading context: ${toolArgs?.documentName || 'documents'}`;
    case 'get_codebase_summary': return `Inspecting architecture map for ${toolArgs?.repoName}`;
    case 'get_git_log': return `Inspecting git log for ${toolArgs?.repoName}`;
    case 'get_git_commit_diff': return `Inspecting commit in ${toolArgs?.repoName}`;
    case 'get_git_contributors': return `Checking contributors for ${toolArgs?.repoName}`;
    default: return 'Retrieving information';
  }
}

// =====================================================================
// OpenRouter API Runner (Luna 6, High Effort)
// =====================================================================
async function handleOpenRouterChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime) {
  if (!openrouterKey) return false;

  const tools = TOOL_DECLARATIONS.map(decl => ({
    type: 'function',
    function: {
      name: decl.name,
      description: decl.description,
      parameters: decl.parameters,
    }
  }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }))
  ];

  function addSource(src) {
    if (src && src.url && !accessedSources.has(src.url)) {
      accessedSources.set(src.url, src);
    }
  }

  let toolCallsCount = 0;
  const maxToolCalls = 3;

  while (true) {
    const isToolCallLimitReached = toolCallsCount >= maxToolCalls;

    const reqBody = {
      model: openrouterModel,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      reasoning: { effort: 'high' },
      reasoning_effort: 'high',
    };

    if (!isToolCallLimitReached) {
      reqBody.tools = tools;
    }

    let resp = null;
    const turnStartTime = Date.now();
    try {
      resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://projects.christian-f-brinkmann.de/',
          'X-Title': 'Christian Brinkmann Portfolio',
        },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(35000),
      });
    } catch (err) {
      console.warn('[ChatServer] OpenRouter fetch error:', err.message);
      return false; // trigger fallback
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn(`[ChatServer] OpenRouter API error (${resp.status}):`, errText.slice(0, 200));
      return false; // trigger fallback
    }

    const data = await resp.json();
    const choice = data?.choices?.[0];
    const message = choice?.message;
    if (!message) return false;

    // If reasoning was returned, stream preview as status event
    if (message.reasoning) {
      const cleanReasoning = message.reasoning.replace(/[*#_`]/g, '').trim().split(/\s+/).slice(0, 6).join(' ');
      if (cleanReasoning) {
        res.write(`data: ${JSON.stringify({ type: 'status', message: cleanReasoning })}\n\n`);
      }
    }

    // Check if tool_calls
    if (message.tool_calls && message.tool_calls.length > 0 && !isToolCallLimitReached) {
      toolCallsCount++;
      messages.push(message);

      for (const tc of message.tool_calls) {
        const toolName = tc.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(tc.function.arguments || '{}');
        } catch {}

        const friendlyName = getFriendlyToolName(toolName, toolArgs);
        res.write(`data: ${JSON.stringify({ type: 'status', message: friendlyName })}\n\n`);

        const toolResult = await executeTool(toolName, toolArgs, addSource);

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: toolName,
          content: JSON.stringify(toolResult),
        });
      }
      continue;
    }

    // Got textual response! Stream in natural chunks
    const fullText = (message.content || '').trim();
    if (fullText) {
      let firstTokenTime = null;
      const chunkSize = 20;
      for (let i = 0; i < fullText.length; i += chunkSize) {
        if (!firstTokenTime) firstTokenTime = Date.now();
        const slice = fullText.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ type: 'delta', text: slice })}\n\n`);
        await new Promise(r => setTimeout(r, 12));
      }

      // Send referenced sources event
      const sourcesList = Array.from(accessedSources.values()).slice(0, 5);
      if (sourcesList.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'sources', sources: sourcesList })}\n\n`);
      }

      // Calculate generation metrics
      const durationMs = Date.now() - requestStartTime;
      const ttftMs = firstTokenTime ? Math.max(10, firstTokenTime - turnStartTime) : Math.max(10, Date.now() - turnStartTime);
      const generationDurationSec = Math.max(0.05, (Date.now() - turnStartTime) / 1000);
      const inputTokens = data?.usage?.prompt_tokens || Math.max(1, Math.round(JSON.stringify(messages).length / 3.8));
      const thinkingTokens = data?.usage?.completion_tokens_details?.reasoning_tokens || (message.reasoning ? Math.max(1, Math.round(message.reasoning.length / 3.8)) : 0);
      const outputTokens = data?.usage?.completion_tokens || Math.max(1, Math.round(fullText.length / 3.8));
      const totalTokens = inputTokens + thinkingTokens + outputTokens;
      const tokensPerSec = Math.round((thinkingTokens + outputTokens) / generationDurationSec);
      const costFormatted = calculateCost(openrouterModel, inputTokens, outputTokens + thinkingTokens);

      res.write(`data: ${JSON.stringify({
        type: 'meta',
        model: `openrouter/${openrouterModel}`,
        durationMs,
        ttftMs,
        inputTokens,
        thinkingTokens,
        outputTokens,
        totalTokens,
        tokensPerSec,
        costFormatted,
      })}\n\n`);

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return true;
    }

    // Empty content fallback: prompt synthesis
    messages.push({
      role: 'user',
      content: 'Please summarize and present your final answer for the user now.',
    });
  }
}

// =====================================================================
// Cerebras API Runner (OpenAI Compatible)
// =====================================================================
async function handleCerebrasChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime) {
  if (!cerebrasKey) return false;

  const tools = TOOL_DECLARATIONS.map(decl => ({
    type: 'function',
    function: {
      name: decl.name,
      description: decl.description,
      parameters: decl.parameters,
    }
  }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }))
  ];

  function addSource(src) {
    if (src && src.url && !accessedSources.has(src.url)) {
      accessedSources.set(src.url, src);
    }
  }

  let toolCallsCount = 0;
  const maxToolCalls = 3;

  while (true) {
    const isToolCallLimitReached = toolCallsCount >= maxToolCalls;

    const reqBody = {
      model: cerebrasModel,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    };

    if (!isToolCallLimitReached) {
      reqBody.tools = tools;
    }

    let resp = null;
    const turnStartTime = Date.now();
    try {
      resp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cerebrasKey}`,
          'User-Agent': 'PortfolioChat/1.0',
        },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(25000),
      });
    } catch (err) {
      console.warn('[ChatServer] Cerebras fetch error:', err.message);
      return false; // trigger fallback
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn(`[ChatServer] Cerebras API error (${resp.status}):`, errText.slice(0, 200));
      return false; // trigger fallback
    }

    const data = await resp.json();
    const choice = data?.choices?.[0];
    const message = choice?.message;
    if (!message) return false;

    // Check if tool_calls
    if (message.tool_calls && message.tool_calls.length > 0 && !isToolCallLimitReached) {
      toolCallsCount++;
      messages.push(message);

      for (const tc of message.tool_calls) {
        const toolName = tc.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(tc.function.arguments || '{}');
        } catch {}

        const friendlyName = getFriendlyToolName(toolName, toolArgs);
        res.write(`data: ${JSON.stringify({ type: 'status', message: friendlyName })}\n\n`);

        const toolResult = await executeTool(toolName, toolArgs, addSource);

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: toolName,
          content: JSON.stringify(toolResult),
        });
      }
      continue;
    }

    // Got textual response! Stream in natural chunks
    const fullText = (message.content || '').trim();
    if (fullText) {
      let firstTokenTime = null;
      const chunkSize = 20;
      for (let i = 0; i < fullText.length; i += chunkSize) {
        if (!firstTokenTime) firstTokenTime = Date.now();
        const slice = fullText.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ type: 'delta', text: slice })}\n\n`);
        await new Promise(r => setTimeout(r, 12));
      }

      // Send referenced sources event
      const sourcesList = Array.from(accessedSources.values()).slice(0, 5);
      if (sourcesList.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'sources', sources: sourcesList })}\n\n`);
      }

      // Calculate generation metrics
      const durationMs = Date.now() - requestStartTime;
      const ttftMs = firstTokenTime ? Math.max(10, firstTokenTime - turnStartTime) : Math.max(10, Date.now() - turnStartTime);
      const generationDurationSec = Math.max(0.05, (Date.now() - turnStartTime) / 1000);
      const inputTokens = data?.usage?.prompt_tokens || Math.max(1, Math.round(JSON.stringify(messages).length / 3.8));
      const thinkingTokens = data?.usage?.completion_tokens_details?.reasoning_tokens || 0;
      const outputTokens = data?.usage?.completion_tokens || Math.max(1, Math.round(fullText.length / 3.8));
      const totalTokens = inputTokens + thinkingTokens + outputTokens;
      const tokensPerSec = Math.round((thinkingTokens + outputTokens) / generationDurationSec);
      const costFormatted = calculateCost(cerebrasModel, inputTokens, outputTokens + thinkingTokens);

      res.write(`data: ${JSON.stringify({
        type: 'meta',
        model: `cerebras/${cerebrasModel}`,
        durationMs,
        ttftMs,
        inputTokens,
        thinkingTokens,
        outputTokens,
        totalTokens,
        tokensPerSec,
        costFormatted,
      })}\n\n`);

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return true;
    }

    // Empty content fallback: prompt synthesis
    messages.push({
      role: 'user',
      content: 'Please summarize and present your final answer for the user now.',
    });
  }
}

// =====================================================================
// Gemini API Runner with SSE Streaming & Tool Loop
// =====================================================================
async function handleGeminiChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime) {
  if (!quotaTracker) return false;

  // Format contents for Gemini API
  const contents = [];
  const recent = userMessages.slice(-8); // Keep last 8 turns max
  for (const m of recent) {
    const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: String(m.content || '').slice(0, 2000) }]
    });
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    return false;
  }

  function addSource(src) {
    if (src && src.url && !accessedSources.has(src.url)) {
      accessedSources.set(src.url, src);
    }
  }

  let toolCallsCount = 0;
  const maxToolCalls = 3;

  while (true) {
    const isToolCallLimitReached = toolCallsCount >= maxToolCalls;

    // Build request body
    const requestBody = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
    };

    // Always attach tools so multi-turn tool history remains valid
    requestBody.tools = [{ functionDeclarations: TOOL_DECLARATIONS }];
    if (isToolCallLimitReached) {
      requestBody.toolConfig = {
        functionCallingConfig: { mode: 'NONE' }
      };
    }

    let responseData = null;
    let successfulModel = null;
    const maxAttempts = quotaTracker.models.length * quotaTracker.apiKeys.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const lease = quotaTracker.selectModelAndKey(1500);
      if (!lease) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const { model, key, release } = lease;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent?key=${encodeURIComponent(key)}`;
      const turnStartTime = Date.now();

      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(20000),
        });

        if (resp.status === 429 || resp.status === 503) {
          const retryAfter = resp.headers.get('retry-after');
          const retrySec = retryAfter ? parseInt(retryAfter, 10) : 1800;
          console.warn(`[ChatServer] Model ${model.id} returned HTTP ${resp.status}. Cooldown for ${retrySec}s. Retrying next model.`);
          release(false, true, retrySec);
          continue; // Retry with next key/model in attempt loop
        }

        if (resp.status === 404) {
          console.warn(`[ChatServer] Model ${model.id} returned HTTP 404. Cooldown for 24h. Retrying next model.`);
          release(false, true, 86400);
          continue; // Retry with next key/model in attempt loop
        }

        if (!resp.ok) {
          const errText = await resp.text();
          console.warn(`[ChatServer] Gemini API error (${resp.status}):`, errText.slice(0, 200));
          release(false, false);
          continue; // Retry with next key/model in attempt loop
        }

        responseData = await resp.json();
        successfulModel = model;
        release(true, false);
        break; // Successfully got response!
      } catch (err) {
        console.warn(`[ChatServer] Fetch error/timeout on model ${model.id}:`, err.message);
        const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timeout');
        release(false, isTimeout, 1800);
        continue;
      }
    }

    if (!responseData) {
      return false;
    }

    const candidate = responseData?.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      return false;
    }

    const parts = candidate.content.parts;
    const functionCallPart = parts.find(p => p.functionCall);

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;

      if (toolCallsCount < maxToolCalls) {
        toolCallsCount++;
        const friendlyName = name === 'list_projects' ? 'Checking projects catalog' :
                             name === 'get_project_details' ? `Loading details for ${args.projectId || 'project'}` :
                             name === 'get_personal_bio' ? 'Loading bio and background' :
                             name === 'read_repo_file' ? `Inspecting ${args.filePath || 'code'}` :
                             name === 'search_code' ? `Searching code for "${args.searchTerm}"` :
                             name === 'list_repo_files' ? `Listing files in ${args.repoName}` : 'Retrieving information';

        res.write(`data: ${JSON.stringify({ type: 'status', message: friendlyName })}\n\n`);

        const toolResult = await executeTool(name, args || {}, addSource);

        contents.push({
          role: 'model',
          parts: parts,
        });
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: name,
              response: { name: name, content: toolResult }
            }
          }]
        });

        continue;
      } else {
        // Tool call limit reached: satisfy Gemini functionResponse protocol and instruct model to formulate final answer
        res.write(`data: ${JSON.stringify({ type: 'status', message: 'Synthesizing response' })}\n\n`);
        contents.push({
          role: 'model',
          parts: parts,
        });
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: name,
              response: {
                name: name,
                content: {
                  note: 'Information limit reached. Do not call any further tools. Present your comprehensive, well-structured answer to the user now.'
                }
              }
            }
          }]
        });

        continue;
      }
    }

    // Model generated the textual answer! Stream final text tokens
    const textParts = parts.filter(p => p.text && !p.thought);
    const fullText = textParts.map(p => p.text).join('\n').trim();
    if (fullText) {
      let firstTokenTime = null;
      const chunkSize = 20;
      for (let i = 0; i < fullText.length; i += chunkSize) {
        if (!firstTokenTime) firstTokenTime = Date.now();
        const slice = fullText.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ type: 'delta', text: slice })}\n\n`);
        await new Promise(r => setTimeout(r, 15)); // Smooth streaming cadence
      }

      // Send referenced sources event if available
      const sourcesList = Array.from(accessedSources.values()).slice(0, 5);
      if (sourcesList.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'sources', sources: sourcesList })}\n\n`);
      }

      // Calculate generation metrics
      const durationMs = Date.now() - requestStartTime;
      const ttftMs = firstTokenTime ? Math.max(10, firstTokenTime - turnStartTime) : Math.max(10, Date.now() - turnStartTime);
      const generationDurationSec = Math.max(0.05, (Date.now() - turnStartTime) / 1000);
      const inputTokens = responseData?.usageMetadata?.promptTokenCount || Math.max(1, Math.round(JSON.stringify(contents).length / 3.8));
      const thinkingTokens = responseData?.usageMetadata?.candidatesTokensDetails?.reduce((sum, d) => sum + (d.modality === 'TEXT' ? 0 : d.tokenCount || 0), 0) || 0;
      const outputTokens = responseData?.usageMetadata?.candidatesTokenCount || Math.max(1, Math.round(fullText.length / 3.8));
      const totalTokens = inputTokens + thinkingTokens + outputTokens;
      const tokensPerSec = Math.round((thinkingTokens + outputTokens) / generationDurationSec);
      const costFormatted = calculateCost(successfulModel ? successfulModel.id : 'gemini', inputTokens, outputTokens);

      res.write(`data: ${JSON.stringify({
        type: 'meta',
        model: successfulModel ? successfulModel.id : 'gemini',
        durationMs,
        ttftMs,
        inputTokens,
        thinkingTokens,
        outputTokens,
        totalTokens,
        tokensPerSec,
        costFormatted,
      })}\n\n`);

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return true;
    }

    // Fallback: If fullText is empty and no functionCallPart, request final text synthesis
    contents.push({
      role: 'model',
      parts: parts,
    });
    contents.push({
      role: 'user',
      parts: [{ text: 'Please summarize and present your final answer for the user now.' }]
    });
    continue;
  }
}

// =====================================================================
// Dispatcher: Primary Provider with Multi-Tier Fallback
// Order: OpenRouter (Luna 6) -> Gemini -> Cerebras (last resort)
// =====================================================================
async function handleChatStream(req, res, userMessages, clientLang = 'en') {
  const requestStartTime = Date.now();
  const accessedSources = new Map();

  const primary = (process.env.LLM_PROVIDER || PRIMARY_PROVIDER || 'openrouter').toLowerCase().trim();

  // Tier 1: OpenRouter (Luna 6, High Effort)
  if (primary === 'openrouter' && openrouterConfigured) {
    const success = await handleOpenRouterChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime);
    if (success) return;
    console.warn('[ChatServer] OpenRouter (Luna 6) unavailable, falling back to Gemini...');
  }

  // If primary was specifically configured as cerebras
  if (primary === 'cerebras' && cerebrasConfigured) {
    const success = await handleCerebrasChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime);
    if (success) return;
    console.warn('[ChatServer] Cerebras unavailable, falling back to Gemini...');
  }

  // Tier 2: Gemini Provider (Multi-Key Rotation & Quota Degradation)
  if (quotaTracker) {
    const success = await handleGeminiChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime);
    if (success) return;
    console.warn('[ChatServer] Gemini unavailable, falling back to Cerebras (last resort)...');
  }

  // Tier 3: Cerebras Provider (Last Resort)
  if (cerebrasConfigured) {
    console.log('[ChatServer] Attempting Cerebras fallback (last resort)...');
    const success = await handleCerebrasChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime);
    if (success) return;
  }

  // Fallback to OpenRouter if primary was not openrouter and others failed
  if (primary !== 'openrouter' && openrouterConfigured) {
    console.log('[ChatServer] Attempting OpenRouter fallback...');
    const success = await handleOpenRouterChatStream(req, res, userMessages, clientLang, accessedSources, requestStartTime);
    if (success) return;
  }

  res.write(`data: ${JSON.stringify({ type: 'error', error: 'AI models are currently unavailable. Please try again shortly.' })}\n\n`);
  res.end();
}

// =====================================================================
// HTTP Server & Routing
// =====================================================================
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', 'http://localhost');

  // Healthcheck endpoint
  if (req.method === 'GET' && (parsedUrl.pathname === '/api/chat/health' || parsedUrl.pathname === '/health')) {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      primaryProvider: (process.env.LLM_PROVIDER || PRIMARY_PROVIDER || 'openrouter').toLowerCase().trim(),
      priorityOrder: ['openrouter (luna-6)', 'gemini', 'cerebras (last resort)'],
      providers: {
        openrouter: {
          configured: openrouterConfigured,
          model: openrouterModel,
          reasoningEffort: 'high',
        },
        gemini: {
          configured: Boolean(quotaTracker),
          activeModels: quotaTracker ? quotaTracker.models.map(m => m.id) : [],
        },
        cerebras: {
          configured: cerebrasConfigured,
          model: cerebrasModel,
        },
      }
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
    return;
  }

  // Chat SSE Streaming Endpoint
  if (req.method === 'POST' && (parsedUrl.pathname === '/api/chat' || parsedUrl.pathname === '/chat')) {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';

    if (!isClientAllowed(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) { // Max 20KB payload
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
        const lang = parsed.lang || 'en';

        // SSE Response Headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Tells Nginx not to buffer
        });

        await handleChatStream(req, res, messages, lang);
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Malformed JSON payload.' }));
        } else {
          res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
          res.end();
        }
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found.' }));
});

server.listen(PORT, HOST, () => {
  console.log(`[ChatServer] Portfolio AI Chat Assistant listening on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
  if (quotaTracker) quotaTracker.saveState();
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (quotaTracker) quotaTracker.saveState();
  process.exit(0);
});
