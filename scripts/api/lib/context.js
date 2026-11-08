const fs = require('fs');
const path = require('path');
const { contextDir } = require('./paths');
const { extractPdfText } = require('./documents');

const TEXT_EXTENSIONS = new Set(['.md', '.markdown', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.csv', '.pdf']);
const MAX_CONTEXT_BYTES = 20 * 1024 * 1024;

function isSafeContextPath(relPath) {
  if (!relPath || typeof relPath !== 'string' || relPath.includes('\0')) return false;
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || path.isAbsolute(normalized)) return false;
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment.startsWith('.'))) return false;
  return true;
}

function listContextDocuments() {
  if (!contextDir || !fs.existsSync(contextDir)) return [];
  const documents = [];

  function walk(dir, prefix = '') {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) continue;
      try {
        const stat = fs.statSync(full);
        documents.push({
          name: rel,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        });
      } catch {
        // Skip unreadable files.
      }
    }
  }

  walk(contextDir);
  documents.sort((a, b) => a.name.localeCompare(b.name));
  return documents;
}

function resolveContextDocument(name) {
  if (!isSafeContextPath(name)) return null;
  const clean = String(name).replace(/\\/g, '/').replace(/^\/+/, '');
  const fullPath = path.join(contextDir, clean);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;

  try {
    const realRoot = fs.realpathSync(contextDir);
    const realFile = fs.realpathSync(fullPath);
    if (realFile !== realRoot && !realFile.startsWith(realRoot + path.sep)) return null;
    const stat = fs.statSync(realFile);
    if (stat.size <= 0 || stat.size > MAX_CONTEXT_BYTES) return null;
    return { path: realFile, name: clean, size: stat.size, mtimeMs: stat.mtimeMs };
  } catch {
    return null;
  }
}

function readContextDocument(name, { offset = 0, maxChars = 40000 } = {}) {
  const resolved = resolveContextDocument(name);
  if (!resolved) return null;

  const ext = path.extname(resolved.name).toLowerCase();
  let text;
  let pages = null;
  let format = 'text';

  if (ext === '.pdf') {
    const extracted = extractPdfText(resolved.path, null);
    text = extracted.text;
    pages = extracted.pages;
    format = 'pdf';
  } else {
    text = fs.readFileSync(resolved.path, 'utf8');
  }

  const start = Math.max(0, parseInt(offset, 10) || 0);
  const cap = Math.min(200000, Math.max(1000, parseInt(maxChars, 10) || 40000));
  const slice = text.slice(start, start + cap);
  const nextOffset = start + slice.length < text.length ? start + slice.length : null;

  return {
    document: resolved.name,
    format,
    pages,
    size: resolved.size,
    totalChars: text.length,
    offset: start,
    nextOffset,
    truncated: nextOffset !== null,
    content: slice,
  };
}

module.exports = {
  listContextDocuments,
  readContextDocument,
  isSafeContextPath,
};
