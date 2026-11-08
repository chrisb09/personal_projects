const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  repoDir,
  extraRepoDir,
  summariesDir,
  apiBaseUrl,
} = require('./paths');
const { getProjects } = require('./projects');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.tif', '.tiff', '.svg'];
const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.svg': 'image/svg+xml',
};
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const BINARY_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp3', '.mp4', '.wav', '.ogg', '.webm',
  '.sqlite', '.db', '.iso', '.img', '.dmg', '.msi', '.deb', '.rpm',
]);
const SKIP_DIRECTORIES = new Set([
  '.git', 'node_modules', '__pycache__', 'dist', 'build', 'target', 'vendor',
  '.venv', 'venv', 'coverage', 'out', 'bin', 'obj', '.idea', '.vscode',
]);

const FORBIDDEN_PATTERNS = [
  /^\.env/i,
  /\.env$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.ssh/i,
  /\.git[\\/]config/i,
  /\.(pem|crt|key|p12|pfx)$/i,
  /\.(zip|tar|gz|bz2|xz|7z|rar|jar|war)$/i,
  /\.(exe|so|dylib|dll|bin|o|a|class|pyc)$/i,
];

function normalizeRelativePath(relPath) {
  return String(relPath || '').replace(/\\/g, '/');
}

function isImagePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  return IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

function isSafeRelativePath(relPath) {
  if (!relPath || typeof relPath !== 'string' || relPath.includes('\0')) return false;
  const normalized = normalizeRelativePath(relPath);
  if (!normalized || normalized.includes('..') || path.isAbsolute(normalized) || normalized.startsWith('/')) return false;
  return normalized.split('/').every((segment) => segment && !segment.startsWith('.'));
}

function isSafeFilePath(relPath) {
  if (!isSafeRelativePath(relPath)) return false;
  return !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(relPath));
}

function isSafeImagePath(relPath) {
  return isSafeRelativePath(relPath) && isImagePath(relPath);
}

function isPathInside(parentPath, childPath) {
  try {
    const realParent = fs.realpathSync(parentPath);
    const realChild = fs.realpathSync(childPath);
    return realChild === realParent || realChild.startsWith(realParent + path.sep);
  } catch {
    return false;
  }
}

function findRepoPath(repoName) {
  if (!repoName || typeof repoName !== 'string') return null;
  const clean = repoName.trim();
  if (!clean || clean === '.' || clean === '..' || clean.includes('..') || /[\\/]/.test(clean)) return null;

  for (const root of [repoDir, extraRepoDir]) {
    if (!root || !fs.existsSync(root)) continue;
    const direct = path.join(root, clean);
    if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
    try {
      const match = fs.readdirSync(root).find((entry) => entry.toLowerCase() === clean.toLowerCase());
      if (match) {
        const candidate = path.join(root, match);
        if (fs.statSync(candidate).isDirectory()) return candidate;
      }
    } catch {
      // Ignore unreadable roots.
    }
  }
  return null;
}

function listRepos() {
  const repos = [];
  for (const [source, root] of [['repos', repoDir], ['extra-repos', extraRepoDir]]) {
    if (!root || !fs.existsSync(root)) continue;
    let entries = [];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const repoPath = path.join(root, entry.name);
      const hasGit = fs.existsSync(path.join(repoPath, '.git'));
      repos.push({
        name: entry.name,
        source,
        hasGit,
        url: getRepoUrl(entry.name),
      });
    }
  }
  repos.sort((a, b) => a.name.localeCompare(b.name));
  return repos;
}

let repoUrlCache = { at: 0, map: new Map() };

function getRepoUrlMap() {
  const now = Date.now();
  if (now - repoUrlCache.at < 60000) return repoUrlCache.map;
  const map = new Map();
  for (const project of getProjects()) {
    for (const repo of project.repos || []) {
      if (!repo.name) continue;
      map.set(String(repo.name).toLowerCase(), repo.url || null);
    }
  }
  repoUrlCache = { at: now, map };
  return map;
}

function getRepoUrl(repoName) {
  const clean = String(repoName || '').trim().toLowerCase();
  if (!clean) return null;
  return getRepoUrlMap().get(clean) || null;
}

function getRepoCommitHash(repoPath) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoPath,
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim() || 'HEAD';
  } catch {
    return 'HEAD';
  }
}

function getFileUrl(repoName, filePath, startLine, endLine) {
  const repoUrl = getRepoUrl(repoName);
  if (!repoUrl) return null;
  const cleanFile = normalizeRelativePath(filePath).replace(/^\/+/, '');
  const repoPath = findRepoPath(repoName);
  const ref = repoPath ? getRepoCommitHash(repoPath) : 'HEAD';
  const anchor = startLine
    ? (endLine && endLine !== startLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`)
    : '';

  if (repoUrl.includes('github.com')) {
    return `${repoUrl.replace(/\.git$/, '')}/blob/${ref}/${cleanFile}${anchor}`;
  }
  if (repoUrl.includes('gitlab')) {
    return `${repoUrl.replace(/\.git$/, '')}/-/blob/${ref}/${cleanFile}${anchor}`;
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

function getRepoImageUrl(repoName, relPath) {
  return `${apiBaseUrl}/repos/${encodeURIComponent(repoName)}/image?path=${encodeURIComponent(normalizeRelativePath(relPath))}`;
}

function listRepoFiles(repoName, subDirectory = '') {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;

  let targetDir = repoPath;
  if (subDirectory) {
    if (!isSafeRelativePath(subDirectory)) return { error: 'Invalid subDirectory path.' };
    targetDir = path.join(repoPath, subDirectory);
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return { error: 'Target directory does not exist.' };
    }
    if (!isPathInside(repoPath, targetDir)) return { error: 'Target directory is outside the repository.' };
  }

  const entries = [];
  let directoryEntries;
  try {
    directoryEntries = fs.readdirSync(targetDir, { withFileTypes: true });
  } catch {
    return { error: 'Unable to read directory.' };
  }
  for (const entry of directoryEntries) {
    if (entry.name.startsWith('.') || SKIP_DIRECTORIES.has(entry.name)) continue;
    if (entries.length >= 100) break;
    const item = {
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
    };
    if (entry.isFile() && isImagePath(entry.name)) {
      const relPath = path.relative(repoPath, path.join(targetDir, entry.name)).split(path.sep).join('/');
      if (isSafeImagePath(relPath)) {
        item.isImage = true;
        item.imageUrl = getRepoImageUrl(repoName, relPath);
        item.markdown = `![${entry.name}](${item.imageUrl})`;
      }
    }
    entries.push(item);
  }

  return {
    repository: repoName,
    directory: subDirectory || '/',
    entries,
  };
}

function readRepoFile(repoName, filePath, { startLine = 1, lineCount = 100 } = {}) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;

  const requestedPath = normalizeRelativePath(filePath || '');
  if (isImagePath(requestedPath)) {
    if (!isSafeImagePath(requestedPath)) return { error: 'Invalid or disallowed image path.' };
    const imagePath = path.join(repoPath, requestedPath);
    if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) return { error: 'Image does not exist.' };
    if (!isPathInside(repoPath, imagePath)) return { error: 'Image is outside the repository.' };
    const stat = fs.statSync(imagePath);
    if (stat.size > MAX_IMAGE_BYTES) return { error: 'Image is too large.' };
    return {
      repository: repoName,
      file: requestedPath,
      isImage: true,
      sizeBytes: stat.size,
      url: getRepoImageUrl(repoName, requestedPath),
      markdown: `![${path.basename(requestedPath)}](${getRepoImageUrl(repoName, requestedPath)})`,
    };
  }

  if (!isSafeFilePath(requestedPath)) return { error: 'Access to this file is restricted or disallowed.' };
  if (BINARY_EXTENSIONS.has(path.extname(requestedPath).toLowerCase())) {
    return { error: 'Binary file; use a dedicated viewer or download it directly from the repository.' };
  }
  const fullPath = path.join(repoPath, requestedPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return { error: 'File does not exist.' };
  if (!isPathInside(repoPath, fullPath)) return { error: 'File is outside the repository.' };

  const stat = fs.statSync(fullPath);
  if (stat.size > MAX_TEXT_BYTES) return { error: 'File is too large to read directly.' };

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const start = Math.max(1, parseInt(startLine, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(lineCount, 10) || 100));
  const sliced = lines.slice(start - 1, start - 1 + limit);
  const end = start + sliced.length - 1;

  return {
    repository: repoName,
    file: requestedPath,
    totalLines: lines.length,
    startLine: start,
    endLine: end,
    linesReturned: sliced.length,
    content: sliced.join('\n'),
    fileUrl: getFileUrl(repoName, requestedPath, start, end),
  };
}

function searchRepoCode(repoName, searchTerm, { maxResults = 20 } = {}) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;
  const query = String(searchTerm || '').trim().toLowerCase();
  if (query.length < 2) return { error: 'Search term too short.' };

  const max = Math.min(50, Math.max(1, parseInt(maxResults, 10) || 20));
  const matches = [];
  let scanned = 0;
  const maxScanned = 10000;

  function walk(currentDir, depth) {
    if (depth > 8 || matches.length >= max || scanned >= maxScanned) return;
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (matches.length >= max || scanned >= maxScanned) break;
      if (entry.name.startsWith('.') || SKIP_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const relPath = path.relative(repoPath, fullPath).split(path.sep).join('/');
      if (!isSafeFilePath(relPath)) continue;
      if (BINARY_EXTENSIONS.has(path.extname(relPath).toLowerCase())) continue;
      scanned += 1;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size <= 0 || stat.size > 1024 * 1024) continue;
        const text = fs.readFileSync(fullPath, 'utf8');
        const lines = text.split('\n');
        for (let index = 0; index < lines.length; index += 1) {
          if (lines[index].toLowerCase().includes(query)) {
            matches.push({
              file: relPath,
              line: index + 1,
              snippet: lines[index].trim().slice(0, 240),
              fileUrl: getFileUrl(repoName, relPath, index + 1, index + 1),
            });
            if (matches.length >= max) break;
          }
        }
      } catch {
        // Skip unreadable files.
      }
    }
  }

  walk(repoPath, 0);
  return {
    repository: repoName,
    searchTerm,
    scannedFiles: scanned,
    matches,
  };
}

function getGitLog(repoName, { maxCommits = 10, filePath = '', author = '' } = {}) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;
  const max = Math.min(50, Math.max(1, parseInt(maxCommits, 10) || 10));
  const args = ['log', '-n', String(max), '--format=%h%x09%H%x09%cs%x09%an%x09%ae%x09%s'];
  if (author) args.push(`--author=${author}`);
  if (filePath) {
    if (!isSafeFilePath(filePath)) return { error: 'Invalid file path.' };
    args.push('--', filePath);
  }

  try {
    const raw = execFileSync('git', args, {
      cwd: repoPath,
      timeout: 10000,
      maxBuffer: 5 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    const commits = raw ? raw.split('\n').map((line) => {
      const [shortHash, fullHash, date, authorName, authorEmail, subject] = line.split('\t');
      return {
        commit: shortHash,
        hash: fullHash,
        date,
        author: authorName,
        email: authorEmail,
        title: subject,
        url: getCommitUrl(repoName, fullHash || shortHash),
      };
    }) : [];
    return { repository: repoName, commitsCount: commits.length, commits };
  } catch (error) {
    return { error: `Failed to read git log: ${error.message}` };
  }
}

function getGitCommitDiff(repoName, commitHash, { filePath = '' } = {}) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;
  const ref = String(commitHash || 'HEAD').trim();
  if (!/^[a-zA-Z0-9_~^.-]+$/.test(ref)) return { error: 'Invalid commit reference.' };

  try {
    const stat = execFileSync('git', ['show', '--stat', '--oneline', ref], {
      cwd: repoPath,
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();

    const args = ['show', '--format=', ref];
    if (filePath) {
      if (!isSafeFilePath(filePath)) return { error: 'Invalid file path.' };
      args.push('--', filePath);
    }
    const patch = execFileSync('git', args, {
      cwd: repoPath,
      timeout: 10000,
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();

    const patchLines = patch.split('\n');
    const maxPatchLines = 500;
    const diff = patchLines.slice(0, maxPatchLines).join('\n')
      + (patchLines.length > maxPatchLines ? `\n... (truncated, total ${patchLines.length} lines)` : '');

    return {
      repository: repoName,
      commit: ref,
      url: getCommitUrl(repoName, ref),
      stat: stat.split('\n').slice(0, 30).join('\n'),
      diff,
    };
  } catch (error) {
    return { error: `Failed to inspect commit: ${error.message}` };
  }
}

function getGitContributors(repoName) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;
  try {
    const raw = execFileSync('git', ['shortlog', '-sne', 'HEAD'], {
      cwd: repoPath,
      timeout: 10000,
      maxBuffer: 5 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    const contributors = raw ? raw.split('\n').map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.+?)\s+<([^>]+)>$/);
      if (match) return { commits: parseInt(match[1], 10), name: match[2], email: match[3] };
      return { raw: line.trim() };
    }) : [];
    return { repository: repoName, totalContributors: contributors.length, contributors };
  } catch (error) {
    return { error: `Failed to read contributors: ${error.message}` };
  }
}

function getRepoSummary(repoName, subPath = '') {
  const clean = String(repoName || '').trim();
  if (!clean || clean.includes('..') || /[\\/]/.test(clean)) return null;
  const direct = path.join(summariesDir, `${clean}.json`);
  let summaryPath = fs.existsSync(direct) ? direct : null;
  if (!summaryPath && fs.existsSync(summariesDir)) {
    const match = fs.readdirSync(summariesDir).find((file) => file.toLowerCase() === `${clean.toLowerCase()}.json`);
    if (match) summaryPath = path.join(summariesDir, match);
  }
  if (!summaryPath) return null;

  try {
    const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    if (!subPath || !data.files || typeof data.files !== 'object') return data;
    const prefix = normalizeRelativePath(subPath).replace(/^\/+/, '');
    const files = Object.fromEntries(
      Object.entries(data.files).filter(([file]) => file === prefix || file.startsWith(`${prefix}/`))
    );
    return { ...data, files };
  } catch {
    return null;
  }
}

function getRepoImage(repoName, relPath) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;
  if (!isSafeImagePath(relPath)) return null;
  const fullPath = path.join(repoPath, relPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;
  if (!isPathInside(repoPath, fullPath)) return null;

  const stat = fs.statSync(fullPath);
  if (stat.size <= 0 || stat.size > MAX_IMAGE_BYTES) return null;
  const mimeType = IMAGE_MIME_TYPES[path.extname(fullPath).toLowerCase()];
  if (!mimeType) return null;

  return {
    data: fs.readFileSync(fullPath),
    mimeType,
    size: stat.size,
    extension: path.extname(fullPath).toLowerCase(),
  };
}

function findRepoImages(repoName, { subDirectory = '', query = '', maxResults = 12 } = {}) {
  const repoPath = findRepoPath(repoName);
  if (!repoPath) return null;

  let searchRoot = repoPath;
  const sub = normalizeRelativePath(subDirectory).replace(/^\/+|\/+$/g, '');
  if (sub) {
    if (!isSafeRelativePath(sub)) return { error: 'Invalid subDirectory path.' };
    searchRoot = path.join(repoPath, sub);
    if (!fs.existsSync(searchRoot) || !fs.statSync(searchRoot).isDirectory()) {
      return { error: 'Target directory does not exist.' };
    }
    if (!isPathInside(repoPath, searchRoot)) return { error: 'Target directory is outside the repository.' };
  }

  const q = String(query || '').trim().toLowerCase();
  const max = Math.min(50, Math.max(1, parseInt(maxResults, 10) || 12));
  const images = [];
  let scanned = 0;
  const maxScanned = 10000;

  function walk(currentDir, depth) {
    if (depth > 8 || images.length >= max || scanned >= maxScanned) return;
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (images.length >= max || scanned >= maxScanned) break;
      if (entry.name.startsWith('.') || SKIP_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      scanned += 1;
      const relPath = path.relative(repoPath, fullPath).split(path.sep).join('/');
      if (!isSafeImagePath(relPath)) continue;
      if (q && !relPath.toLowerCase().includes(q)) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size <= 0 || stat.size > MAX_IMAGE_BYTES) continue;
        images.push({
          path: relPath,
          name: entry.name,
          sizeBytes: stat.size,
          url: getRepoImageUrl(repoName, relPath),
          markdown: `![${entry.name}](${getRepoImageUrl(repoName, relPath)})`,
        });
      } catch {
        // Skip unreadable files.
      }
    }
  }

  walk(searchRoot, 0);
  return {
    repository: repoName,
    directory: sub || '/',
    query: query || null,
    count: images.length,
    images,
  };
}

module.exports = {
  findRepoPath,
  listRepos,
  listRepoFiles,
  readRepoFile,
  searchRepoCode,
  getGitLog,
  getGitCommitDiff,
  getGitContributors,
  getRepoSummary,
  getRepoImage,
  getRepoImageUrl,
  findRepoImages,
  getRepoUrl,
  getFileUrl,
  getCommitUrl,
  isSafeFilePath,
  isSafeRelativePath,
  isSafeImagePath,
  isImagePath,
  normalizeRelativePath,
};
