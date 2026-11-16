'use strict';
const fs = require('fs');

// Google documents daily Gemini limits as resetting at midnight Pacific time.
function pacificDate(now = Date.now()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => p.find(x => x.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

class ChatQuotaTracker {
  constructor(apiKeys, models, stateFile, now = () => Date.now()) {
    this.apiKeys = apiKeys;
    this.models = models;
    this.stateFile = stateFile;
    this.now = now;
    this.lastUsedKeyIdx = -1;
    this.states = {};
    this.paidTransactions = [];
    this.disabled = false;
    this.load();
  }
  load() {
    try {
      if (!fs.existsSync(this.stateFile)) return;
      const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      this.paidTransactions = Array.isArray(data.paidTransactions) ? data.paidTransactions : [];
      const today = pacificDate(this.now());
      if (data.version === 2) {
        if (!data.models || typeof data.models !== 'object' || Array.isArray(data.models)) throw new Error('Invalid Gemini quota state');
        this.states = data.models;
      } else if (Array.isArray(data.keys)) {
        // Old records contain totals per key but no model dimension. Attribute
        // all potentially current usage to every model until the next reset.
        const current = data.updatedAt ? pacificDate(new Date(data.updatedAt)) === today : data.date === new Date(this.now()).toISOString().slice(0, 10);
        const count = current ? data.keys.reduce((n, k) => n + Math.max(0, Number(k.requestsToday) || 0), 0) : 0;
        for (const model of this.models) this.states[model.id] = { date: today, requestsToday: count, window: [], cooldownUntil: 0 };
      }
    } catch (err) {
      console.error('[ChatServer] Invalid Gemini quota state; Gemini disabled:', err.message);
      this.disabled = true;
    }
  }
  stateFor(model, now) {
    const date = pacificDate(now);
    let state = this.states[model.id];
    if (!state) state = this.states[model.id] = { date, requestsToday: 0, window: [], cooldownUntil: 0 };
    else if (state.date !== date) state = this.states[model.id] = { date, requestsToday: 0, window: state.window || [], cooldownUntil: state.cooldownUntil || 0 };
    if (!Array.isArray(state.window) || !Number.isInteger(state.requestsToday) || state.requestsToday < 0 || state.window.some(x => !x || !Number.isFinite(x.time) || !Number.isFinite(x.tokens) || x.tokens < 0) || (state.cooldownUntil != null && (!Number.isFinite(state.cooldownUntil) || state.cooldownUntil < 0))) throw new Error('Invalid Gemini model quota state');
    state.window = state.window.filter(x => x.time > now - 60000);
    return state;
  }
  saveState() {
    if (this.disabled) return false;
    try {
      const tmp = `${this.stateFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ version: 2, models: this.states, paidTransactions: this.paidTransactions, updatedAt: new Date(this.now()).toISOString() }), { mode: 0o600 });
      fs.renameSync(tmp, this.stateFile);
      return true;
    } catch (err) {
      console.error('[ChatServer] Gemini quota persistence failed; Gemini disabled:', err.message);
      this.disabled = true;
      return false;
    }
  }
  selectModelAndKey(estimatedTokens = 1000, allowedModels = null) {
    if (this.disabled || !Number.isFinite(estimatedTokens) || estimatedTokens < 0 || !this.apiKeys.length) return null;
    const now = this.now();
    try {
      for (const model of this.models) {
        if (allowedModels && !allowedModels.includes(model.id)) continue;
        const state = this.stateFor(model, now);
        if ((state.cooldownUntil || 0) > now || state.requestsToday >= model.rpd || state.window.length >= model.rpm || state.window.reduce((n, x) => n + x.tokens, 0) + estimatedTokens > model.tpm) continue;
        // Reserve an attempt before dispatch so parallel workers cannot all
        // consume the same remaining local quota. External usage is unknown.
        state.requestsToday++;
        state.window.push({ time: now, tokens: estimatedTokens });
        if (!this.saveState()) return null;
        const keyIdx = this.lastUsedKeyIdx = (this.lastUsedKeyIdx + 1) % this.apiKeys.length;
        return {
          model, key: this.apiKeys[keyIdx], keyIdx,
          release: (_success, cooldown, seconds) => {
            if (cooldown) {
              state.cooldownUntil = Math.max(state.cooldownUntil || 0, this.now() + Math.max(1, Number(seconds) || 60) * 1000);
              this.saveState();
            }
          },
        };
      }
    } catch (err) {
      this.disabled = true;
      console.error('[ChatServer] Gemini quota error; Gemini disabled:', err.message);
    }
    return null;
  }
}

module.exports = { ChatQuotaTracker, pacificDate };
