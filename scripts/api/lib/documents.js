const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  projectsDir,
  projectDocumentsDir,
  publicBaseUrl,
  apiBaseUrl,
} = require('./paths');
const { getProject, getProjects, findProjectFolder } = require('./projects');

const textCache = new Map();
const pdfInfoCache = new Map();

const MIME_TYPES = {
  pdf: 'application/pdf',
  markdown: 'text/markdown; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  other: 'application/octet-stream',
};

function isSafeDocumentName(name) {
  if (!name || typeof name !== 'string' || name.includes('\0')) return false;
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false;
  return path.basename(name) === name;
}

function getMimeType(format, fileName) {
  if (MIME_TYPES[format]) return MIME_TYPES[format];
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') return MIME_TYPES.pdf;
  if (ext === '.md' || ext === '.markdown') return MIME_TYPES.markdown;
  if (ext === '.docx') return MIME_TYPES.docx;
  return MIME_TYPES.other;
}

function resolveDocument(projectId, fileName) {
  if (!isSafeDocumentName(fileName)) return null;
  const folder = findProjectFolder(projectId);
  if (!folder) return null;

  const project = getProject(folder, { includeRepoDetails: false });
  if (!project) return null;

  const document = project.documents.find((doc) =>
    doc.files.some((file) => file.file.toLowerCase() === fileName.toLowerCase())
  );
  if (!document) return null;

  const file = document.files.find((entry) => entry.file.toLowerCase() === fileName.toLowerCase());
  if (!file || !file.available) return null;

  const publicPath = path.join(projectDocumentsDir, folder, file.file);
  const configPath = path.join(projectsDir, folder, 'documents', file.file);
  const filePath = fs.existsSync(publicPath) ? publicPath : configPath;

  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const realPath = fs.realpathSync(filePath);
    const allowedRoots = [
      fs.existsSync(projectDocumentsDir) ? fs.realpathSync(projectDocumentsDir) : null,
      fs.realpathSync(projectsDir),
    ].filter(Boolean);
    if (!allowedRoots.some((root) => realPath === root || realPath.startsWith(root + path.sep))) {
      return null;
    }

    return {
      project,
      folder,
      document,
      file,
      path: realPath,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      format: file.format || 'other',
      mimeType: getMimeType(file.format, file.file),
      downloadUrl: `${publicBaseUrl}/documents/projects/${encodeURIComponent(folder)}/${encodeURIComponent(file.file)}`,
      apiUrl: `${apiBaseUrl}/projects/${encodeURIComponent(folder)}/documents/${encodeURIComponent(file.file)}`,
      textUrl: `${apiBaseUrl}/projects/${encodeURIComponent(folder)}/documents/${encodeURIComponent(file.file)}/text`,
    };
  } catch {
    return null;
  }
}

function getPdfPages(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const cached = pdfInfoCache.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached.pages;
    const output = execFileSync('pdfinfo', [filePath], {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    const match = output.match(/^Pages:\s+(\d+)/m);
    const pages = match ? parseInt(match[1], 10) : null;
    pdfInfoCache.set(filePath, { mtimeMs: stat.mtimeMs, size: stat.size, pages });
    return pages;
  } catch {
    return null;
  }
}

function extractPdfText(filePath, page) {
  const stat = fs.statSync(filePath);
  const cacheKey = `${filePath}:${stat.mtimeMs}:${stat.size}:${page || 'all'}`;
  const cached = textCache.get(cacheKey);
  if (cached) return cached;

  const args = ['-layout'];
  if (page) {
    args.push('-f', String(page), '-l', String(page));
  }
  args.push(filePath, '-');

  const raw = execFileSync('pdftotext', args, {
    timeout: 20000,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString('utf8');

  const pages = getPdfPages(filePath);
  let text;
  if (page) {
    text = raw.replace(/\f/g, '').trim();
  } else {
    const parts = raw.split('\f');
    while (parts.length > 0 && !parts[parts.length - 1].trim()) parts.pop();
    text = parts.map((part, index) => `--- Page ${index + 1} ---\n${part.trim()}`).join('\n\n');
  }

  const result = { text, pages };
  textCache.set(cacheKey, result);
  return result;
}

function getFullDocumentText(resolved) {
  const ext = path.extname(resolved.file.file).toLowerCase();
  if (resolved.format === 'markdown' || ext === '.md' || ext === '.markdown' || ext === '.txt') {
    return { text: fs.readFileSync(resolved.path, 'utf8'), pages: null };
  }
  if (resolved.format === 'pdf' || ext === '.pdf') {
    return extractPdfText(resolved.path, null);
  }
  return null;
}

function readDocumentText(projectId, fileName, { offset = 0, maxChars = 40000, page = null } = {}) {
  const resolved = resolveDocument(projectId, fileName);
  if (!resolved) return null;

  const ext = path.extname(resolved.file.file).toLowerCase();
  let text;
  let pages = null;

  if (resolved.format === 'pdf' || ext === '.pdf') {
    const extracted = extractPdfText(resolved.path, page ? Math.max(1, parseInt(page, 10) || 1) : null);
    text = extracted.text;
    pages = extracted.pages;
  } else if (resolved.format === 'markdown' || ext === '.md' || ext === '.markdown' || ext === '.txt') {
    text = fs.readFileSync(resolved.path, 'utf8');
  } else {
    return {
      ...resolved,
      unsupported: true,
      text: '',
      totalChars: 0,
      offset: 0,
      nextOffset: null,
      truncated: false,
      pages: null,
    };
  }

  const start = Math.max(0, parseInt(offset, 10) || 0);
  const cap = Math.min(200000, Math.max(1000, parseInt(maxChars, 10) || 40000));
  const slice = text.slice(start, start + cap);
  const nextOffset = start + slice.length < text.length ? start + slice.length : null;

  return {
    projectId: resolved.project.id,
    projectName: resolved.project.name,
    documentTitle: resolved.document.title,
    file: resolved.file.file,
    format: resolved.format,
    size: resolved.size,
    pages,
    totalChars: text.length,
    offset: start,
    nextOffset,
    truncated: nextOffset !== null,
    text: slice,
    downloadUrl: resolved.downloadUrl,
    apiUrl: resolved.apiUrl,
    textUrl: resolved.textUrl,
  };
}

function listDocuments({ projectId = null, lang = 'en' } = {}) {
  const projects = projectId
    ? [getProject(projectId, { lang, includeRepoDetails: false })].filter(Boolean)
    : getProjects({ lang });

  const documents = [];
  for (const project of projects) {
    for (const document of project.documents) {
      documents.push({
        projectId: project.id,
        projectName: project.name,
        title: document.title,
        description: document.description,
        date: document.date,
        files: document.files,
      });
    }
  }

  return {
    count: documents.length,
    documents,
  };
}

function searchDocuments(query, { lang = 'en', limit = 20 } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const max = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const results = [];

  for (const project of getProjects({ lang })) {
    for (const document of project.documents) {
      for (const file of document.files) {
        if (!file.available) continue;
        const resolved = resolveDocument(project.id, file.file);
        if (!resolved) continue;
        const full = getFullDocumentText(resolved);
        if (!full || !full.text) continue;

        const lower = full.text.toLowerCase();
        let index = lower.indexOf(q);
        let matchesInFile = 0;
        while (index !== -1 && matchesInFile < 3 && results.length < max) {
          const start = Math.max(0, index - 180);
          const end = Math.min(full.text.length, index + q.length + 220);
          const snippet = full.text.slice(start, end).replace(/\s+/g, ' ').trim();
          results.push({
            type: 'document',
            projectId: project.id,
            projectName: project.name,
            documentTitle: document.title,
            file: file.file,
            format: file.format,
            snippet,
            downloadUrl: file.downloadUrl,
            textUrl: file.textUrl,
          });
          matchesInFile += 1;
          index = lower.indexOf(q, index + q.length);
        }
        if (results.length >= max) break;
      }
      if (results.length >= max) break;
    }
    if (results.length >= max) break;
  }

  return results;
}

function getDocumentDownload(projectId, fileName) {
  const resolved = resolveDocument(projectId, fileName);
  if (!resolved) return null;
  return {
    path: resolved.path,
    fileName: resolved.file.file,
    mimeType: resolved.mimeType,
    size: resolved.size,
    mtimeMs: resolved.mtimeMs,
  };
}

module.exports = {
  resolveDocument,
  readDocumentText,
  listDocuments,
  searchDocuments,
  getDocumentDownload,
  getMimeType,
  isSafeDocumentName,
  extractPdfText,
};
