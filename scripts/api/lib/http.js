const crypto = require('crypto');

function setCommonHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
}

function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8', headers = {}) {
  const body = Buffer.isBuffer(text) ? text : Buffer.from(String(text));
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function sendError(res, status, code, message, headers = {}) {
  sendJson(res, status, { error: { code, message } }, headers);
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limit) {
        reject(Object.assign(new Error('Request body too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function requestId() {
  return crypto.randomUUID();
}

function logRequest({ req, res, auth, startedAt, id, route }) {
  const duration = Date.now() - startedAt;
  const entry = {
    ts: new Date().toISOString(),
    level: 'info',
    requestId: id,
    method: req.method,
    path: req.url,
    status: res.statusCode,
    durationMs: duration,
    ip: req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown',
    user: auth?.username || null,
    scope: auth?.scope || null,
    route: route || null,
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  setCommonHeaders,
  sendJson,
  sendText,
  sendError,
  readBody,
  requestId,
  logRequest,
};
