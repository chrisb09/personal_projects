const WINDOW_MS = 60 * 1000;
const buckets = new Map();

function getLimit(scope) {
  const fallback = scope === 'private' ? 600 : 300;
  const envName = scope === 'private' ? 'PORTFOLIO_API_RATE_LIMIT_PRIVATE' : 'PORTFOLIO_API_RATE_LIMIT_PUBLIC';
  const value = parseInt(process.env[envName] || String(fallback), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getClientIp(req) {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req, auth, { bucket = 'general', limit = null } = {}) {
  const scope = auth?.scope || 'public';
  const max = limit || getLimit(scope);
  const key = `${getClientIp(req)}:${auth?.username || 'anonymous'}:${bucket}`;
  const now = Date.now();
  const record = buckets.get(key) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (record.timestamps.length >= max) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    buckets.set(key, record);
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfter,
    };
  }

  record.timestamps.push(now);
  buckets.set(key, record);
  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - record.timestamps.length),
    retryAfter: 0,
  };
}

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, record] of buckets.entries()) {
    record.timestamps = record.timestamps.filter((timestamp) => timestamp > cutoff);
    if (record.timestamps.length === 0) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

module.exports = {
  checkRateLimit,
  getClientIp,
};
