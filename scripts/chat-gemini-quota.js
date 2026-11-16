'use strict';
const fs = require('fs');
const crypto = require('crypto');

// Google documents daily Gemini limits as resetting at midnight Pacific time.
function pacificDate(now = Date.now()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => p.find(x => x.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Gemini quotas are per model and per API key. Tracking one shared pool per
// model made three keys behave like a single 20-request key.
class ChatQuotaTracker {
  constructor(apiKeys, models, stateFile, now = () => Date.now()) {
    this.apiKeys = apiKeys;
    this.models = models;
    this.stateFile = stateFile;
    this.now = now;
    this.lastUsedKeyIdx = -1;
    this.states = {};
    this.modelCooldowns = {};
    this.paidTransactions = [];
    this.disabled = false;
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.stateFile)) return;
      const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      this.paidTransactions = Array.isArray(data.paidTransactions) ? data.paidTransactions : [];
      if (data.modelCooldowns && typeof data.modelCooldowns === 'object' && !Array.isArray(data.modelCooldowns)) {
        if (Object.values(data.modelCooldowns).some(x => !Number.isFinite(x) || x < 0)) throw new Error('Invalid Gemini model cooldown state');
        this.modelCooldowns = data.modelCooldowns;
      }
      const today = pacificDate(this.now());
      if (data.version === 3) {
        if (!data.models || typeof data.models !== 'object' || Array.isArray(data.models)) throw new Error('Invalid Gemini quota state');
        this.states = data.models;
        return;
      }
      if (data.version === 2) {
        if (!data.models || typeof data.models !== 'object' || Array.isArray(data.models)) throw new Error('Invalid Gemini quota state');
        const keyCount = Math.max(1, this.apiKeys.length);
        for (const [modelId, global] of Object.entries(data.models)) {
          if (!global || typeof global !== 'object') throw new Error('Invalid Gemini quota state');
          const count = Number.isInteger(global.requestsToday) && global.requestsToday >= 0 ? global.requestsToday : 0;
          // The old tracker rotated keys, so the global total was roughly
          // evenly spread. Attribute the rounded-up share to every key.
          const perKey = Math.ceil(count / keyCount);
          this.states[modelId] = {};
          for (let k = 0; k < keyCount; k++) {
            this.states[modelId][k] = { date: global.date || today, requestsToday: perKey, window: [], cooldownUntil: 0 };
          }
        }
        return;
      }
      if (Array.isArray(data.keys)) {
        // Version 1 stored only per-key totals across all models. Preserve
        // that conservative attribution for the remainder of the day.
        const current = data.updatedAt ? pacificDate(new Date(data.updatedAt)) === today : data.date === new Date(this.now()).toISOString().slice(0, 10);
        for (const model of this.models) {
          this.states[model.id] = {};
          for (let k = 0; k < this.apiKeys.length; k++) {
            const count = current ? Math.max(0, Number(data.keys[k]?.requestsToday) || 0) : 0;
            this.states[model.id][k] = { date: today, requestsToday: count, window: [], cooldownUntil: 0 };
          }
        }
      }
    } catch (err) {
      console.error('[ChatServer] Invalid Gemini quota state; Gemini disabled:', err.message);
      this.disabled = true;
    }
  }

  stateFor(model, keyIdx, now) {
    const date = pacificDate(now);
    const byKey = this.states[model.id] || (this.states[model.id] = {});
    let state = byKey[keyIdx];
    if (!state) state = byKey[keyIdx] = { date, requestsToday: 0, window: [], cooldownUntil: 0 };
    else if (state.date !== date) state = byKey[keyIdx] = { date, requestsToday: 0, window: state.window || [], cooldownUntil: state.cooldownUntil || 0 };
    if (!Array.isArray(state.window) || !Number.isInteger(state.requestsToday) || state.requestsToday < 0 || state.window.some(x => !x || !Number.isFinite(x.time) || !Number.isFinite(x.tokens) || x.tokens < 0) || (state.cooldownUntil != null && (!Number.isFinite(state.cooldownUntil) || state.cooldownUntil < 0))) {
      throw new Error('Invalid Gemini model quota state');
    }
    state.window = state.window.filter(x => x.time > now - 60000);
    return state;
  }

  saveState() {
    if (this.disabled) return false;
    try {
      const tmp = `${this.stateFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ version: 3, models: this.states, modelCooldowns: this.modelCooldowns, paidTransactions: this.paidTransactions, updatedAt: new Date(this.now()).toISOString() }), { mode: 0o600 });
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
        if ((this.modelCooldowns[model.id] || 0) > now) continue;
        for (let k = 0; k < this.apiKeys.length; k++) {
          const keyIdx = (this.lastUsedKeyIdx + 1 + k) % this.apiKeys.length;
          const state = this.stateFor(model, keyIdx, now);
          if ((state.cooldownUntil || 0) > now) continue;
          if (state.requestsToday >= model.rpd) continue;
          if (state.window.length >= model.rpm) continue;
          if (state.window.reduce((n, x) => n + x.tokens, 0) + estimatedTokens > model.tpm) continue;

          // Reserve before dispatch so parallel workers cannot consume the
          // same remaining quota. Failed non-billable requests are refunded.
          const reservation = { time: now, tokens: estimatedTokens, id: crypto.randomUUID() };
          state.requestsToday++;
          state.window.push(reservation);
          if (!this.saveState()) return null;
          this.lastUsedKeyIdx = keyIdx;
          return {
            model, key: this.apiKeys[keyIdx], keyIdx,
            release: (success, cooldown, seconds, refund = false, modelWide = false) => {
              if (refund) {
                state.requestsToday = Math.max(0, state.requestsToday - 1);
                state.window = state.window.filter(x => x.id !== reservation.id);
              }
              if (cooldown) {
                const until = this.now() + Math.max(1, Number(seconds) || 60) * 1000;
                if (modelWide) this.modelCooldowns[model.id] = Math.max(this.modelCooldowns[model.id] || 0, until);
                else state.cooldownUntil = Math.max(state.cooldownUntil || 0, until);
              }
              this.saveState();
            },
          };
        }
      }
    } catch (err) {
      this.disabled = true;
      console.error('[ChatServer] Gemini quota error; Gemini disabled:', err.message);
    }
    return null;
  }
}

module.exports = { ChatQuotaTracker, pacificDate };
