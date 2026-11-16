'use strict';
const fs = require('fs');

// Persistent one-shot alert state. The flag is cleared by the chat after a
// successful OpenRouter request, so a later exhaustion notifies again.
class OpenRouterAlertState {
  constructor(file, fsImpl = fs) {
    this.file = file;
    this.fs = fsImpl;
    this.state = { notified: false, notifiedAt: null, lastStatus: null };
    this.inFlight = false;
    this.load();
  }

  load() {
    try {
      if (!this.fs.existsSync(this.file)) return;
      const data = JSON.parse(this.fs.readFileSync(this.file, 'utf8'));
      if (typeof data.notified !== 'boolean') throw new Error('Invalid OpenRouter alert state');
      this.state = { notified: data.notified, notifiedAt: data.notifiedAt || null, lastStatus: data.lastStatus || null };
    } catch (err) {
      console.error('[ChatAlerts] Invalid OpenRouter alert state; starting fresh:', err.message);
      this.state = { notified: false, notifiedAt: null, lastStatus: null };
    }
  }

  save() {
    const tmp = `${this.file}.tmp`;
    this.fs.writeFileSync(tmp, JSON.stringify(this.state), { mode: 0o600 });
    this.fs.renameSync(tmp, this.file);
  }

  needsNotification() {
    return !this.state.notified && !this.inFlight;
  }

  isNotified() {
    return this.state.notified;
  }

  markInFlight() {
    this.inFlight = true;
  }

  markFailed() {
    this.inFlight = false;
  }

  markNotified(status) {
    this.state = { notified: true, notifiedAt: new Date().toISOString(), lastStatus: status || null };
    this.inFlight = false;
    try { this.save(); } catch (err) { console.error('[ChatAlerts] Failed to persist alert state:', err.message); }
  }

  reset() {
    if (!this.state.notified && !this.inFlight) return;
    this.state = { notified: false, notifiedAt: null, lastStatus: null };
    this.inFlight = false;
    try { this.save(); } catch (err) { console.error('[ChatAlerts] Failed to persist alert reset:', err.message); }
  }
}

function maskKey(key) {
  if (typeof key !== 'string' || key.length < 20) return 'OpenRouter key';
  return `${key.slice(0, 12)}...${key.slice(-4)}`;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(6)}` : 'Unknown';
}

function buildOpenRouterExhaustedPayload({ keyStatus, key, now = new Date() }) {
  const data = keyStatus && typeof keyStatus === 'object' ? keyStatus : {};
  const budget = Array.isArray(data.budgets)
    ? data.budgets.find(b => b && b.scope === 'key_limit') || data.budgets[0]
    : null;
  const limit = data.limit ?? budget?.limit_usd;
  const usage = data.usage ?? budget?.spend_usd;
  const remaining = data.limit_remaining ?? budget?.remaining_usd;
  const label = data.label || maskKey(key);
  let reset = 'Unknown';
  if (data.limit_reset === 'monthly') reset = 'Monthly';
  else if (data.limit_reset) reset = String(data.limit_reset);
  const resetsAt = budget?.resets_at || data.resets_at;
  if (resetsAt) {
    const date = new Date(resetsAt);
    if (!Number.isNaN(date.getTime())) reset += ` (next ${date.toISOString().slice(0, 10)})`;
  }
  const remainingNumber = Number(remaining);
  return {
    username: 'Portfolio Audit Sentinel',
    embeds: [{
      title: '⚠️ OpenRouter key exhausted',
      description: 'The portfolio chat has no remaining OpenRouter credit and is falling back to Gemini.',
      color: 0xf59e0b,
      fields: [
        { name: 'Key', value: `\`${label}\``, inline: true },
        { name: 'Limit', value: Number.isFinite(Number(limit)) ? `$${Number(limit).toFixed(2)}` : 'Unknown', inline: true },
        { name: 'Usage', value: money(usage), inline: true },
        { name: 'Remaining', value: money(Number.isFinite(remainingNumber) ? Math.max(0, remainingNumber) : 0), inline: true },
        { name: 'Reset', value: reset, inline: true },
        { name: 'Action', value: 'Raise the key limit or add credits in OpenRouter. The chat is falling back to Gemini.', inline: false },
      ],
      timestamp: now.toISOString(),
      footer: { text: 'Portfolio Chat' },
    }],
  };
}

async function fetchOpenRouterKeyStatus(key, fetchImpl = fetch) {
  const res = await fetchImpl('https://openrouter.ai/api/v1/key', {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OpenRouter key status returned ${res.status}`);
  const data = await res.json();
  return data?.data || {};
}

async function sendOpenRouterExhaustedAlert({ webhookUrl, key, state, fetchImpl = fetch, now = () => new Date() }) {
  if (!webhookUrl) return { sent: false, reason: 'no-webhook' };
  if (!state.needsNotification()) return { sent: false, reason: 'already-notified' };
  state.markInFlight();
  let keyStatus = null;
  try {
    keyStatus = await fetchOpenRouterKeyStatus(key, fetchImpl);
  } catch (err) {
    console.warn('[ChatAlerts] Could not read OpenRouter key status:', err.message);
  }
  try {
    const res = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOpenRouterExhaustedPayload({ keyStatus, key, now: now() })),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      state.markFailed();
      return { sent: false, reason: `webhook ${res.status}` };
    }
    state.markNotified(keyStatus);
    return { sent: true };
  } catch (err) {
    state.markFailed();
    return { sent: false, reason: err.message };
  }
}

module.exports = {
  OpenRouterAlertState,
  buildOpenRouterExhaustedPayload,
  fetchOpenRouterKeyStatus,
  sendOpenRouterExhaustedAlert,
};
