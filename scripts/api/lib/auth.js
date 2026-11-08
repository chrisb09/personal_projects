const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function loadUsers() {
  const users = new Map();

  const raw = process.env.PORTFOLIO_API_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      for (const [username, value] of Object.entries(parsed || {})) {
        if (!username) continue;
        if (typeof value === 'string') {
          users.set(username, { password: value, scope: 'private' });
        } else if (value && typeof value.password === 'string') {
          users.set(username, {
            password: value.password,
            scope: value.scope === 'public' ? 'public' : 'private',
          });
        }
      }
    } catch (error) {
      console.error(`[portfolio-api] Invalid PORTFOLIO_API_USERS JSON: ${error.message}`);
    }
  }

  const username = process.env.PORTFOLIO_API_USER;
  const password = process.env.PORTFOLIO_API_PASSWORD;
  if (username && password && !users.has(username)) {
    users.set(username, { password, scope: 'private' });
  }

  return users;
}

const users = loadUsers();
const allowAnonymous = process.env.PORTFOLIO_API_ALLOW_ANONYMOUS === '1';

function assertConfigured() {
  if (users.size === 0 && !allowAnonymous) {
    console.error('[portfolio-api] No credentials configured. Set PORTFOLIO_API_USER and PORTFOLIO_API_PASSWORD, or PORTFOLIO_API_USERS.');
    process.exit(1);
  }
}

function parseBasicHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function authenticate(req) {
  const header = req.headers.authorization;
  if (!header) {
    if (allowAnonymous) return { username: 'anonymous', scope: 'public', anonymous: true };
    return null;
  }

  const credentials = parseBasicHeader(header);
  if (!credentials) return null;

  const user = users.get(credentials.username);
  if (!user) {
    timingSafeEqual(credentials.password, 'invalid-password-placeholder');
    return null;
  }
  if (!timingSafeEqual(credentials.password, user.password)) return null;

  return {
    username: credentials.username,
    scope: user.scope,
    anonymous: false,
  };
}

function sendUnauthorized(res) {
  res.writeHead(401, {
    'Content-Type': 'application/json; charset=utf-8',
    'WWW-Authenticate': 'Basic realm="Portfolio API", charset="UTF-8"',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify({ error: { code: 'unauthorized', message: 'Authentication required.' } }));
}

function sendForbidden(res) {
  res.writeHead(403, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify({ error: { code: 'forbidden', message: 'This credential does not have access to this resource.' } }));
}

function requireAuth(req, res, { scope = 'public' } = {}) {
  const auth = authenticate(req);
  if (!auth) {
    sendUnauthorized(res);
    return null;
  }
  if (scope === 'private' && auth.scope !== 'private') {
    sendForbidden(res);
    return null;
  }
  return auth;
}

function getAuthSummary() {
  return {
    configured: users.size > 0,
    users: Array.from(users.entries()).map(([username, user]) => ({ username, scope: user.scope })),
    anonymousAllowed: allowAnonymous,
  };
}

module.exports = {
  assertConfigured,
  authenticate,
  requireAuth,
  getAuthSummary,
  users,
};
