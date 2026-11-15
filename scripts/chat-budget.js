'use strict';

// Reservations are persisted before dispatch. If a request is interrupted or
// usage is missing, its reservation remains charged conservatively for 24h.
class PaidBudget {
  constructor(file, limit, legacyFile, fs = require('fs')) {
    this.fs = fs;
    this.file = file;
    this.legacyFile = legacyFile;
    this.limit = Number.isFinite(limit) && limit >= 0 ? limit : 0;
    this.entries = [];
    try {
      this.withLock(() => { this.load(); if (!fs.existsSync(file)) this.save(); });
    } catch (err) {
      console.error('[ChatBudget] Unable to read budget state; paid calls disabled:', err.message);
      this.limit = 0;
    }
  }
  withLock(fn) {
    const lock = `${this.file}.lock`;
    let fd;
    for (let i = 0; i < 50; i++) {
      try { fd = this.fs.openSync(lock, 'wx', 0o600); break; }
      catch (err) {
        if (err.code !== 'EEXIST' || i === 49) throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
      }
    }
    try { return fn(); }
    finally { this.fs.closeSync(fd); this.fs.unlinkSync(lock); }
  }
  load() {
    if (this.fs.existsSync(this.file)) {
      const data = JSON.parse(this.fs.readFileSync(this.file, 'utf8'));
      if (!Array.isArray(data.entries) || data.entries.some(e => !e || !Number.isFinite(e.timestamp) || !Number.isFinite(e.amount) || e.amount < 0)) throw new Error('Invalid budget state');
      this.entries = data.entries;
    } else if (this.legacyFile && this.fs.existsSync(this.legacyFile)) {
      const data = JSON.parse(this.fs.readFileSync(this.legacyFile, 'utf8'));
      const transactions = data.paidTransactions || [];
      if (!Array.isArray(transactions) || transactions.some(t => !t || !Number.isFinite(t.timestamp) || !Number.isFinite(t.cost) || t.cost < 0)) throw new Error('Invalid legacy budget state');
      this.entries = transactions.map(t => ({ id: require('crypto').randomUUID(), timestamp: t.timestamp, amount: t.cost, reserved: false }));
    } else this.entries = [];
  }
  clean() {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    this.entries = this.entries.filter(e => Number.isFinite(e.timestamp) && e.timestamp > cutoff && Number.isFinite(e.amount) && e.amount >= 0);
  }
  spent() {
    try { return this.withLock(() => { this.load(); this.clean(); return this.entries.reduce((sum, e) => sum + e.amount, 0); }); }
    catch { return this.limit; }
  }
  save() {
    const tmp = `${this.file}.tmp`;
    this.fs.writeFileSync(tmp, JSON.stringify({ entries: this.entries }), { mode: 0o600 });
    this.fs.renameSync(tmp, this.file);
  }
  reserve(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    try {
      return this.withLock(() => {
        this.load(); this.clean();
        if (this.entries.reduce((sum, e) => sum + e.amount, 0) + amount > this.limit) return null;
        const entry = { id: require('crypto').randomUUID(), timestamp: Date.now(), amount, reserved: true };
        this.entries.push(entry); this.save(); return entry.id;
      });
    } catch { this.limit = 0; return null; }
  }
  settle(id, cost) {
    if (!Number.isFinite(cost) || cost < 0) return false;
    try {
      return this.withLock(() => {
        this.load();
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return false;
        entry.amount = cost; entry.reserved = false; this.save(); return true;
      });
    } catch { this.limit = 0; return false; }
  }
}

// Input bytes conservatively upper-bound text tokens; allow extra for provider
// message/tool wrappers. max_price prevents routing to a more expensive host.
function reserveEstimate(body, promptPrice, completionPrice) {
  const bytes = Buffer.byteLength(JSON.stringify(body), 'utf8');
  if (bytes > 150000 || !Number.isInteger(body.max_tokens) || body.max_tokens < 1) return null;
  return ((bytes + 16384) * promptPrice + body.max_tokens * completionPrice) / 1000000;
}

module.exports = { PaidBudget, reserveEstimate };
