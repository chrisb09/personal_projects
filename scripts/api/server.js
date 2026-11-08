const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

const paths = require('./lib/paths');
const { assertConfigured, requireAuth, getAuthSummary } = require('./lib/auth');
const { checkRateLimit } = require('./lib/rate-limit');
const {
  setCommonHeaders,
  sendJson,
  sendText,
  sendError,
  readBody,
  requestId,
  logRequest,
} = require('./lib/http');
const {
  listProjects,
  getProject,
  getProfileData,
  getStatsData,
  getStatsForProject,
  getActivityData,
} = require('./lib/projects');
const {
  listDocuments,
  readDocumentText,
  getDocumentDownload,
  searchDocuments,
} = require('./lib/documents');
const {
  listRepos,
  listRepoFiles,
  readRepoFile,
  searchRepoCode,
  getGitLog,
  getGitCommitDiff,
  getGitContributors,
  getRepoSummary,
  getRepoImage,
} = require('./lib/repos');
const {
  listContextDocuments,
  readContextDocument,
} = require('./lib/context');
const { registerTools } = require('./mcp/tools');
const { registerResources } = require('./mcp/resources');

const PORT = parseInt(process.env.PORTFOLIO_API_PORT || '3002', 10);
const HOST = process.env.PORTFOLIO_API_HOST || '0.0.0.0';
const API_PREFIX = '/api/portfolio/v1';
const BODY_LIMIT = 1024 * 1024;
const startedAt = Date.now();

assertConfigured();

function createMcpServer(scope) {
  const server = new McpServer(
    { name: 'portfolio', version: '1.0.0' },
    {
      instructions: [
        'Read-only portfolio server for Christian F. Brinkmann.',
        'Start with list_projects, then get_project for details.',
        'Use read_document to read project document text; PDFs are extracted server-side.',
        'Use list_repos, read_repo_file, search_repo_code and get_git_log for private repository inspection when the connection uses a private credential.',
        'Use read_context for Christian’s personal background documents.',
        'All URLs returned by the server are absolute and ready to use.',
      ].join(' '),
    }
  );
  registerTools(server, { scope });
  registerResources(server, { scope });
  return server;
}

async function handleMcp(req, res, auth) {
  const rate = checkRateLimit(req, auth, { bucket: 'mcp' });
  res.setHeader('X-RateLimit-Limit', String(rate.limit));
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    sendError(res, 429, 'rate_limited', 'Too many requests. Try again later.');
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendError(res, 405, 'method_not_allowed', 'Use POST for MCP Streamable HTTP.');
    return;
  }

  let body;
  try {
    body = await readBody(req, BODY_LIMIT);
  } catch (error) {
    sendError(res, error.statusCode || 400, 'invalid_body', error.message);
    return;
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    sendError(res, 400, 'invalid_json', 'Malformed JSON body.');
    return;
  }

  const mcp = createMcpServer(auth.scope);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    transport.close().catch(() => {});
    mcp.close().catch(() => {});
  });

  await mcp.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
}

function getQuery(url, name, fallback = '') {
  const value = url.searchParams.get(name);
  return value === null ? fallback : value;
}

function getIntQuery(url, name, fallback) {
  const value = parseInt(url.searchParams.get(name) || '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function parseSegments(pathname) {
  return pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
}

function privateOnly(res, auth) {
  if (auth.scope !== 'private') {
    sendError(res, 403, 'forbidden', 'This endpoint requires a private credential.');
    return false;
  }
  return true;
}

function sendDocumentDownload(req, res, projectId, file) {
  const download = getDocumentDownload(projectId, file);
  if (!download) {
    sendError(res, 404, 'document_not_found', 'Document not found.');
    return;
  }

  const safeName = download.fileName.replace(/["\\\r\n]/g, '_');
  const headers = {
    'Content-Type': download.mimeType,
    'Content-Length': download.size,
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'private, max-age=300',
    'ETag': `"${download.mtimeMs}-${download.size}"`,
    'Last-Modified': new Date(download.mtimeMs).toUTCString(),
  };

  if (req.method === 'HEAD') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  res.writeHead(200, headers);
  fs.createReadStream(download.path).pipe(res);
}

function sendRepoImage(req, res, repoName, relPath) {
  const image = getRepoImage(repoName, relPath);
  if (!image) {
    sendError(res, 404, 'image_not_found', 'Image not found.');
    return;
  }

  const headers = {
    'Content-Type': image.mimeType,
    'Content-Length': image.size,
    'Cache-Control': 'private, max-age=3600',
  };
  if (image.extension === '.svg') {
    headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  }
  res.writeHead(200, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(image.data);
}

async function handleRest(req, res, auth, url) {
  const rate = checkRateLimit(req, auth, { bucket: 'rest' });
  res.setHeader('X-RateLimit-Limit', String(rate.limit));
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    sendError(res, 429, 'rate_limited', 'Too many requests. Try again later.');
    return;
  }

  const relative = url.pathname.slice(API_PREFIX.length) || '/';
  let parts;
  try {
    parts = parseSegments(relative);
  } catch {
    sendError(res, 400, 'invalid_path', 'Malformed URL path.');
    return;
  }

  const method = req.method;
  const isRead = method === 'GET' || method === 'HEAD';
  if (!isRead) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    sendError(res, 405, 'method_not_allowed', 'This API is read-only.');
    return;
  }

  if (parts.length === 1 && parts[0] === 'health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'portfolio-api',
      version: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      auth: getAuthSummary(),
      counts: {
        projects: listProjects({ limit: 200 }).count,
        documents: listDocuments().count,
        ...(auth.scope === 'private' ? { repos: listRepos().length } : {}),
      },
    });
    return;
  }

  if (parts.length === 1 && parts[0] === 'profile') {
    sendJson(res, 200, getProfileData());
    return;
  }

  if (parts.length === 1 && parts[0] === 'projects') {
    sendJson(res, 200, listProjects({
      lang: getQuery(url, 'lang', 'en'),
      q: getQuery(url, 'q'),
      category: getQuery(url, 'category'),
      status: getQuery(url, 'status'),
      technology: getQuery(url, 'technology'),
      role: getQuery(url, 'role'),
      sourceType: getQuery(url, 'sourceType'),
      aiUsage: getQuery(url, 'aiUsage'),
      limit: getIntQuery(url, 'limit', 100),
      offset: getIntQuery(url, 'offset', 0),
    }));
    return;
  }

  if (parts[0] === 'projects' && parts.length >= 2) {
    const projectId = parts[1];
    const lang = getQuery(url, 'lang', 'en');

    if (parts.length === 2) {
      const project = getProject(projectId, {
        lang,
        includeRepoDetails: auth.scope === 'private',
      });
      if (!project) {
        sendError(res, 404, 'project_not_found', `Project '${projectId}' not found.`);
        return;
      }
      sendJson(res, 200, project);
      return;
    }

    if (parts.length === 3 && parts[2] === 'documents') {
      if (!getProject(projectId, { lang, includeRepoDetails: false })) {
        sendError(res, 404, 'project_not_found', `Project '${projectId}' not found.`);
        return;
      }
      sendJson(res, 200, listDocuments({ projectId, lang }));
      return;
    }

    if (parts.length === 4 && parts[2] === 'documents') {
      sendDocumentDownload(req, res, projectId, parts[3]);
      return;
    }

    if (parts.length === 5 && parts[2] === 'documents' && parts[4] === 'text') {
      const result = readDocumentText(projectId, parts[3], {
        offset: getIntQuery(url, 'offset', 0),
        maxChars: getIntQuery(url, 'maxChars', 40000),
        page: getIntQuery(url, 'page', null),
      });
      if (!result) {
        sendError(res, 404, 'document_not_found', 'Document not found.');
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 3 && parts[2] === 'assets') {
      const project = getProject(projectId, { lang, includeRepoDetails: false });
      if (!project) {
        sendError(res, 404, 'project_not_found', `Project '${projectId}' not found.`);
        return;
      }
      sendJson(res, 200, {
        projectId: project.id,
        name: project.name,
        logo: project.assets.logo,
        screenshots: project.assets.screenshots,
        readyToUse: project.assets.readyToUse,
      });
      return;
    }
  }

  if (parts.length === 1 && parts[0] === 'stats') {
    sendJson(res, 200, getStatsData());
    return;
  }

  if (parts.length === 2 && parts[0] === 'stats') {
    const stats = getStatsForProject(parts[1]);
    if (!stats) {
      sendError(res, 404, 'project_not_found', `Project '${parts[1]}' not found.`);
      return;
    }
    sendJson(res, 200, stats);
    return;
  }

  if (parts.length === 1 && parts[0] === 'activity') {
    sendJson(res, 200, getActivityData());
    return;
  }

  if (parts.length === 1 && parts[0] === 'search') {
    const q = getQuery(url, 'q');
    if (q.trim().length < 2) {
      sendError(res, 400, 'invalid_query', 'Query must be at least 2 characters.');
      return;
    }
    const lang = getQuery(url, 'lang', 'en');
    const limit = getIntQuery(url, 'limit', 20);
    const projects = listProjects({ q, lang, limit }).projects;
    const documents = searchDocuments(q, { lang, limit });
    sendJson(res, 200, {
      query: q,
      projectCount: projects.length,
      documentCount: documents.length,
      projects,
      documents,
    });
    return;
  }

  if (parts[0] === 'repos') {
    if (!privateOnly(res, auth)) return;

    if (parts.length === 1) {
      const repos = listRepos();
      sendJson(res, 200, { count: repos.length, repos });
      return;
    }

    const repoName = parts[1];

    if (parts.length === 3 && parts[2] === 'files') {
      const result = listRepoFiles(repoName, getQuery(url, 'path'));
      if (!result) {
        sendError(res, 404, 'repo_not_found', `Repository '${repoName}' not found.`);
        return;
      }
      if (result.error) {
        sendError(res, 400, 'invalid_request', result.error);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 3 && parts[2] === 'file') {
      const result = readRepoFile(repoName, getQuery(url, 'path'), {
        startLine: getIntQuery(url, 'start', 1),
        lineCount: getIntQuery(url, 'lines', 100),
      });
      if (!result) {
        sendError(res, 404, 'repo_not_found', `Repository '${repoName}' not found.`);
        return;
      }
      if (result.error) {
        sendError(res, 400, 'invalid_request', result.error);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 3 && parts[2] === 'search') {
      const result = searchRepoCode(repoName, getQuery(url, 'q'), {
        maxResults: getIntQuery(url, 'maxResults', 20),
      });
      if (!result) {
        sendError(res, 404, 'repo_not_found', `Repository '${repoName}' not found.`);
        return;
      }
      if (result.error) {
        sendError(res, 400, 'invalid_request', result.error);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 3 && parts[2] === 'summary') {
      const result = getRepoSummary(repoName, getQuery(url, 'subPath'));
      if (!result) {
        sendError(res, 404, 'summary_not_found', `No precomputed summary found for '${repoName}'.`);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 3 && parts[2] === 'image') {
      sendRepoImage(req, res, repoName, getQuery(url, 'path'));
      return;
    }

    if (parts.length === 4 && parts[2] === 'git' && parts[3] === 'log') {
      const result = getGitLog(repoName, {
        maxCommits: getIntQuery(url, 'limit', 10),
        filePath: getQuery(url, 'filePath'),
        author: getQuery(url, 'author'),
      });
      if (!result) {
        sendError(res, 404, 'repo_not_found', `Repository '${repoName}' not found.`);
        return;
      }
      if (result.error) {
        sendError(res, 400, 'invalid_request', result.error);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 4 && parts[2] === 'git' && parts[3] === 'contributors') {
      const result = getGitContributors(repoName);
      if (!result) {
        sendError(res, 404, 'repo_not_found', `Repository '${repoName}' not found.`);
        return;
      }
      if (result.error) {
        sendError(res, 400, 'invalid_request', result.error);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (parts.length === 5 && parts[2] === 'git' && parts[3] === 'commit') {
      const result = getGitCommitDiff(repoName, parts[4], {
        filePath: getQuery(url, 'filePath'),
      });
      if (!result) {
        sendError(res, 404, 'repo_not_found', `Repository '${repoName}' not found.`);
        return;
      }
      if (result.error) {
        sendError(res, 400, 'invalid_request', result.error);
        return;
      }
      sendJson(res, 200, result);
      return;
    }
  }

  if (parts.length === 1 && parts[0] === 'context') {
    if (!privateOnly(res, auth)) return;
    const name = getQuery(url, 'name');
    if (!name) {
      sendJson(res, 200, { documents: listContextDocuments() });
      return;
    }
    const result = readContextDocument(name, {
      offset: getIntQuery(url, 'offset', 0),
      maxChars: getIntQuery(url, 'maxChars', 40000),
    });
    if (!result) {
      sendError(res, 404, 'context_not_found', `Context document '${name}' not found.`);
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  sendError(res, 404, 'not_found', 'Endpoint not found.');
}

const server = http.createServer(async (req, res) => {
  const id = requestId();
  const started = Date.now();
  res.setHeader('X-Request-Id', id);
  setCommonHeaders(res);

  let auth = null;
  let route = null;

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Allow': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
      });
      res.end();
      return;
    }

    if (url.pathname === '/health' && (req.method === 'GET' || req.method === 'HEAD')) {
      route = 'health';
      sendJson(res, 200, {
        status: 'ok',
        service: 'portfolio-api',
        version: '1.0.0',
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      });
      return;
    }

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      route = 'mcp';
      auth = requireAuth(req, res, { scope: 'public' });
      if (!auth) return;
      await handleMcp(req, res, auth);
      return;
    }

    if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
      route = 'rest';
      auth = requireAuth(req, res, { scope: 'public' });
      if (!auth) return;
      await handleRest(req, res, auth, url);
      return;
    }

    sendError(res, 404, 'not_found', 'Endpoint not found.');
  } catch (error) {
    const status = error.statusCode || 500;
    if (!res.headersSent) {
      sendError(res, status, status === 500 ? 'internal_error' : 'request_error', status === 500 ? 'Internal server error.' : error.message);
    } else {
      res.destroy();
    }
    if (status === 500) {
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        requestId: id,
        message: error.message,
        stack: error.stack,
      }));
    }
  } finally {
    logRequest({ req, res, auth, startedAt: started, id, route });
  }
});

server.headersTimeout = 65000;
server.requestTimeout = 120000;
server.keepAliveTimeout = 60000;

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'info',
    message: 'portfolio-api listening',
    host: HOST,
    port: PORT,
    configDir: paths.configDir,
    publicDir: paths.publicDir,
    repoDir: paths.repoDir,
    contextDir: paths.contextDir,
  }));
});

function shutdown(signal) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', message: `received ${signal}, shutting down` }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
