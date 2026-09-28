const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =====================================================================
// Paths & Setup
// =====================================================================
const rootDir = path.resolve(__dirname, '..');
const possibleRepoDirs = [
  '/app/repos',
  '/container/data/personal_projects/repos',
  path.join(rootDir, 'repos'),
];
const possibleExtraDirs = [
  '/app/extra-repos',
  path.join(rootDir, 'extra-repos'),
  '/data/backups',
];
const possibleOutputDirs = [
  '/app/data/repo-summaries',
  path.join(rootDir, 'data/repo-summaries'),
];

function resolveFirst(list) {
  for (const p of list) {
    if (p && fs.existsSync(p)) return p;
  }
  return list[list.length - 1];
}

const repoBaseDir = resolveFirst(possibleRepoDirs);
const extraBaseDir = resolveFirst(possibleExtraDirs);
const outputDir = resolveFirst(possibleOutputDirs);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const cacheFile = path.join(outputDir, '.cache.json');
let cache = {};
if (fs.existsSync(cacheFile)) {
  try {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {}
}

// Arguments
const args = process.argv.slice(2);
const targetRepo = args.find((_, i) => args[i - 1] === '--repo');
const isForce = args.includes('--force');
const isDryRun = args.includes('--dry-run');

console.log('[Summaries] Repository base:', repoBaseDir);
console.log('[Summaries] Output directory:', outputDir);
console.log(`[Summaries] Cache entries loaded: ${Object.keys(cache).length}`);

// =====================================================================
// Safe AI Environment Loader
// =====================================================================
function loadAiEnv() {
  const possiblePaths = [
    process.env.AI_ENV_PATH,
    '/run/secrets/ai.env',
    '/scripts/ai.env',
    path.join(rootDir, 'ai.env'),
  ].filter(Boolean);

  let content = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        content = fs.readFileSync(p, 'utf8');
        break;
      } catch {}
    }
  }
  if (!content) return null;

  const env = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const [k, ...v] = t.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const aiEnv = loadAiEnv();
const geminiKeys = (aiEnv?.GEMINI_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
const openrouterKey = (aiEnv?.OPENROUTER_API_KEYS || '').split(',')[0].trim();
const openrouterModel = (aiEnv?.OPENROUTER_MODEL_IDS || 'gpt-6-luna').split(',')[0].trim();

// =====================================================================
// AI Summarizer (Exclusively Free Tier Google Gemini Flash-Lite & OpenRouter)
// Cerebras is completely excluded here to avoid paid API costs.
// =====================================================================
let geminiKeyIdx = 0;

async function summarizeTextWithAi(filePath, codeSnippet) {
  if (isDryRun) {
    return `[DryRun] Mock summary for ${path.basename(filePath)}`;
  }

  const prompt = `You are a concise software engineering documentation assistant.
In 1 to 2 concise sentences (max 30 words), state what this source file does, its primary exported functions/classes, and its role in the project.
Preserve exact class and function names with backticks.

File: ${filePath}
Code snippet:
\`\`\`
${codeSnippet.slice(0, 2000)}
\`\`\``;

  // 1. Primary: Free-tier Google AI Studio Gemini 3.5 Flash-Lite (rotating across 3 keys)
  if (geminiKeys.length > 0) {
    for (let i = 0; i < geminiKeys.length; i++) {
      const key = geminiKeys[geminiKeyIdx % geminiKeys.length];
      geminiKeyIdx++;
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return text;
        }
      } catch {}
    }
  }

  // 2. Secondary fallback: Free-tier Gemini 3.1 Flash-Lite
  if (geminiKeys.length > 0) {
    const key = geminiKeys[geminiKeyIdx % geminiKeys.length];
    geminiKeyIdx++;
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {}
  }

  // 3. Fallback: OpenRouter Luna 6
  if (openrouterKey) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://projects.christian-f-brinkmann.de/',
        },
        body: JSON.stringify({
          model: openrouterModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 120,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {}
  }

  return `Source module implementing ${path.basename(filePath)} logic.`;
}

// Compute SHA-256 hash of file content
function computeFileHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Check if a file should be included in code summaries
const ALLOWED_EXTS = new Set([
  '.c', '.cpp', '.h', '.hpp', '.cc',
  '.java', '.kt',
  '.py',
  '.ts', '.tsx', '.js', '.jsx',
  '.rs', '.go', '.cs', '.php',
  '.sh', '.bash',
  '.cmake', '.toml', '.yml', '.yaml', '.json',
  '.md', '.txt'
]);

const IGNORED_NAMES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
  '.gitignore', '.gitmodules', '.editorconfig',
  'tsconfig.json', 'stats.json', 'cache.json',
]);

const IGNORED_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'out',
  '.venv', 'venv', '__pycache__', 'temp', 'tmp',
  'assets', 'images', 'public', '.idea', '.vscode'
]);

function shouldSummarizeFile(relPath, fileName, fileSize) {
  if (fileSize > 250000 || fileSize < 10) return false;
  if (IGNORED_NAMES.has(fileName)) return false;
  const ext = path.extname(fileName).toLowerCase();
  if (fileName === 'CMakeLists.txt' || fileName === 'Makefile' || fileName === 'Dockerfile') return true;
  return ALLOWED_EXTS.has(ext);
}

// Discover source files in a repository
function discoverRepoFiles(repoDir, maxFiles = 30) {
  const files = [];

  function walk(currentDir, relBase = '') {
    if (files.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const ent of entries) {
        if (files.length >= maxFiles) break;
        if (ent.name.startsWith('.') && ent.name !== '.github') continue;
        if (ent.isDirectory()) {
          if (!IGNORED_DIRS.has(ent.name)) {
            walk(path.join(currentDir, ent.name), relBase ? `${relBase}/${ent.name}` : ent.name);
          }
        } else if (ent.isFile()) {
          const relPath = relBase ? `${relBase}/${ent.name}` : ent.name;
          const stat = fs.statSync(path.join(currentDir, ent.name));
          if (shouldSummarizeFile(relPath, ent.name, stat.size)) {
            files.push({
              relPath,
              fullPath: path.join(currentDir, ent.name),
              size: stat.size,
            });
          }
        }
      }
    } catch {}
  }

  walk(repoDir);
  return files;
}

// =====================================================================
// Repository Processor
// =====================================================================
async function processRepository(repoName, repoPath) {
  console.log(`\n[Summaries] === Processing Repository: ${repoName} ===`);
  const files = discoverRepoFiles(repoPath, 12);
  console.log(`[Summaries] Discovered ${files.length} key source files to index.`);

  const repoSummaryFile = path.join(outputDir, `${repoName}.json`);
  let existingSummary = { repository: repoName, files: {}, directories: {}, overview: '' };
  if (fs.existsSync(repoSummaryFile)) {
    try {
      existingSummary = JSON.parse(fs.readFileSync(repoSummaryFile, 'utf8'));
    } catch {}
  }

  const filesResult = existingSummary.files || {};
  let newOrModifiedCount = 0;
  let cachedCount = 0;

  const concurrency = 3;
  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency);
    await Promise.all(chunk.map(async f => {
      const content = fs.readFileSync(f.fullPath, 'utf8');
      const hash = computeFileHash(content);

      if (!isForce && cache[hash]) {
        filesResult[f.relPath] = {
          hash,
          summary: cache[hash],
          lines: content.split('\n').length,
        };
        cachedCount++;
        return;
      }

      console.log(`[Summaries] Generating AI summary for: ${f.relPath}...`);
      const summary = await summarizeTextWithAi(f.relPath, content);
      cache[hash] = summary;
      filesResult[f.relPath] = {
        hash,
        summary,
        lines: content.split('\n').length,
      };
      newOrModifiedCount++;
    }));

    // Save cache after each chunk so progress is never lost
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}
  }

  // Derive directory summaries
  const dirMap = {};
  for (const [relPath, fData] of Object.entries(filesResult)) {
    const dir = path.dirname(relPath);
    if (dir && dir !== '.') {
      if (!dirMap[dir]) dirMap[dir] = [];
      dirMap[dir].push(path.basename(relPath));
    }
  }

  const directoriesSummary = {};
  for (const [d, fNames] of Object.entries(dirMap)) {
    directoriesSummary[d] = `Contains ${fNames.length} module files (${fNames.slice(0, 4).join(', ')})`;
  }

  const result = {
    repository: repoName,
    updatedAt: new Date().toISOString(),
    filesCount: Object.keys(filesResult).length,
    directories: directoriesSummary,
    files: filesResult,
  };

  fs.writeFileSync(repoSummaryFile, JSON.stringify(result, null, 2), 'utf8');
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`[Summaries] Finished ${repoName}: ${newOrModifiedCount} generated, ${cachedCount} reused from hash-cache.`);
  return result;
}

// =====================================================================
// Main Runner
// =====================================================================
async function run() {
  const masterIndex = {};

  // Find all repositories to summarize
  const reposToProcess = [];

  if (targetRepo) {
    // Single repo specified
    const p1 = path.join(repoBaseDir, targetRepo);
    const p2 = path.join(extraBaseDir, targetRepo);
    const p3 = path.join(extraBaseDir, 'low_repos', targetRepo);
    const p4 = path.join(extraBaseDir, 'smartsim_playground', targetRepo);
    const found = [p1, p2, p3, p4].find(p => fs.existsSync(p));
    if (found) {
      reposToProcess.push({ name: targetRepo, path: found });
    } else {
      console.error(`[Summaries] Target repository '${targetRepo}' not found.`);
      process.exit(1);
    }
  } else {
    // Process showcased repositories in repos directory
    if (fs.existsSync(repoBaseDir)) {
      const list = fs.readdirSync(repoBaseDir, { withFileTypes: true });
      for (const ent of list) {
        if (ent.isDirectory() && fs.existsSync(path.join(repoBaseDir, ent.name, '.git'))) {
          reposToProcess.push({ name: ent.name, path: path.join(repoBaseDir, ent.name) });
        }
      }
    }
  }

  console.log(`[Summaries] Found ${reposToProcess.length} repositories to index.`);

  for (const r of reposToProcess) {
    try {
      const summary = await processRepository(r.name, r.path);
      masterIndex[r.name] = {
        filesCount: summary.filesCount,
        updatedAt: summary.updatedAt,
        directories: Object.keys(summary.directories),
      };
    } catch (err) {
      console.warn(`[Summaries] Failed to process ${r.name}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(masterIndex, null, 2), 'utf8');
  console.log(`\n[Summaries] ✓ Completed! Master index written to ${path.join(outputDir, 'index.json')}`);
}

run().catch(err => {
  console.error('[Summaries] Fatal error:', err);
  process.exit(1);
});
