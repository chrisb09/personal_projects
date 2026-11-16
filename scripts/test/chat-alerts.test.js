'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  OpenRouterAlertState,
  buildOpenRouterExhaustedPayload,
  sendOpenRouterExhaustedAlert,
} = require('../chat-alerts');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openrouter-alert-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'alert.json');
}

const keyStatus = {
  label: 'sk-or-v1-123...cdef',
  limit: 0.5,
  usage: 0.5,
  limit_remaining: 0,
  limit_reset: 'monthly',
  budgets: [{ scope: 'key_limit', resets_at: '2026-12-01T00:00:00.000Z' }],
};

test('alert state persists, deduplicates, and resets', t => {
  const file = fixture(t);
  const first = new OpenRouterAlertState(file);
  assert.equal(first.needsNotification(), true);
  first.markInFlight();
  assert.equal(first.needsNotification(), false);
  first.markNotified(keyStatus);
  assert.equal(first.needsNotification(), false);
  assert.equal(first.isNotified(), true);

  const restarted = new OpenRouterAlertState(file);
  assert.equal(restarted.needsNotification(), false);
  restarted.reset();
  assert.equal(restarted.needsNotification(), true);
  assert.equal(restarted.isNotified(), false);
  assert.equal(new OpenRouterAlertState(file).needsNotification(), true);
});

test('payload masks the key and shows the monthly reset date', () => {
  const key = 'sk-or-v1-1234567890abcdefghijklmnopqrstuvwxyz';
  const payload = buildOpenRouterExhaustedPayload({
    key,
    keyStatus,
    now: new Date('2026-11-16T12:00:00Z'),
  });
  const text = JSON.stringify(payload);
  assert.match(text, /sk-or-v1-123\.\.\.cdef/);
  assert.doesNotMatch(text, new RegExp(key));
  assert.match(text, /Monthly/);
  assert.match(text, /2026-12-01/);
  assert.match(text, /OpenRouter key exhausted/);
});

test('alert sends once, then resets after a successful request', async t => {
  const state = new OpenRouterAlertState(fixture(t));
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes('/api/v1/key')) {
      return { ok: true, json: async () => ({ data: keyStatus }) };
    }
    return { ok: true, status: 204 };
  };

  const first = await sendOpenRouterExhaustedAlert({ webhookUrl: 'https://discord.test/hook', key: 'sk-or-v1-abcdefghijklmnopqrstuvwxyz', state, fetchImpl });
  assert.equal(first.sent, true);
  assert.equal(state.needsNotification(), false);
  const second = await sendOpenRouterExhaustedAlert({ webhookUrl: 'https://discord.test/hook', key: 'sk-or-v1-abcdefghijklmnopqrstuvwxyz', state, fetchImpl });
  assert.equal(second.sent, false);
  assert.equal(second.reason, 'already-notified');
  state.reset();
  const third = await sendOpenRouterExhaustedAlert({ webhookUrl: 'https://discord.test/hook', key: 'sk-or-v1-abcdefghijklmnopqrstuvwxyz', state, fetchImpl });
  assert.equal(third.sent, true);
});

test('webhook failure keeps the alert eligible for retry', async t => {
  const state = new OpenRouterAlertState(fixture(t));
  const fetchImpl = async (url) => {
    if (url.includes('/api/v1/key')) return { ok: true, json: async () => ({ data: keyStatus }) };
    return { ok: false, status: 500 };
  };
  const result = await sendOpenRouterExhaustedAlert({ webhookUrl: 'https://discord.test/hook', key: 'sk-or-v1-abcdefghijklmnopqrstuvwxyz', state, fetchImpl });
  assert.equal(result.sent, false);
  assert.match(result.reason, /webhook 500/);
  assert.equal(state.needsNotification(), true);
});
