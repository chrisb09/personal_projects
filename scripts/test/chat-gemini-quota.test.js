'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ChatQuotaTracker, pacificDate } = require('../chat-gemini-quota');

const models = [{ id: 'hydrogen', rpm: 3, tpm: 10000, rpd: 2 }, { id: 'flash', rpm: 5, tpm: 10000, rpd: 5 }];
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-quota-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'quota.json');
}

test('quota is reserved per model and per key, and persists across restart', t => {
  const file = fixture(t), now = () => Date.parse('2026-11-16T20:00:00Z');
  const tracker = new ChatQuotaTracker(['a', 'b'], models, file, now);
  for (let i = 0; i < 4; i++) assert.equal(tracker.selectModelAndKey(100).model.id, 'hydrogen');
  assert.equal(tracker.selectModelAndKey(100).model.id, 'flash');
  const restarted = new ChatQuotaTracker(['a', 'b'], models, file, now);
  assert.equal(restarted.selectModelAndKey(100).model.id, 'flash');
  assert.equal(restarted.states.hydrogen['0'].requestsToday, 2);
  assert.equal(restarted.states.hydrogen['1'].requestsToday, 2);
});

test('429 cooldown uses fallback and daily quota resets at Pacific midnight', t => {
  const file = fixture(t); let clock = Date.parse('2026-11-16T07:59:30Z');
  const tracker = new ChatQuotaTracker(['a'], models, file, () => clock);
  tracker.selectModelAndKey(100).release(false, true, 120);
  assert.equal(tracker.selectModelAndKey(100).model.id, 'flash');
  clock = Date.parse('2026-11-16T08:00:00Z');
  assert.equal(pacificDate(clock), '2026-11-16');
  assert.equal(tracker.selectModelAndKey(100).model.id, 'flash');
  clock = Date.parse('2026-11-16T08:02:00Z');
  assert.equal(tracker.selectModelAndKey(100).model.id, 'hydrogen');
});

test('transient provider failures are refunded rather than consuming daily quota', t => {
  const file = fixture(t); let clock = Date.parse('2026-11-16T20:00:00Z');
  const tracker = new ChatQuotaTracker(['a'], models, file, () => clock);
  tracker.selectModelAndKey(100).release(false, true, 60, true);
  assert.equal(tracker.states.hydrogen['0'].requestsToday, 0);
  assert.equal(tracker.states.hydrogen['0'].window.length, 0);
  clock += 61000;
  assert.equal(tracker.selectModelAndKey(100).model.id, 'hydrogen');
});

test('legacy per-key totals are conservatively attributed to each model', t => {
  const file = fixture(t), time = Date.parse('2026-11-16T20:00:00Z');
  fs.writeFileSync(file, JSON.stringify({ keys: [{ requestsToday: 2 }, { requestsToday: 2 }], updatedAt: new Date(time).toISOString(), paidTransactions: [{ cost: 0.01 }] }));
  const tracker = new ChatQuotaTracker(['a', 'b'], models, file, () => time);
  assert.equal(tracker.selectModelAndKey(100).model.id, 'flash');
  assert.equal(JSON.parse(fs.readFileSync(file)).paidTransactions.length, 1);
});

test('version 2 global totals are spread across keys during migration', t => {
  const file = fixture(t), time = Date.parse('2026-11-16T20:00:00Z');
  fs.writeFileSync(file, JSON.stringify({ version: 2, models: { hydrogen: { date: '2026-11-16', requestsToday: 2, window: [], cooldownUntil: 0 } } }));
  const tracker = new ChatQuotaTracker(['a', 'b'], models, file, () => time);
  assert.equal(tracker.states.hydrogen['0'].requestsToday, 1);
  assert.equal(tracker.states.hydrogen['1'].requestsToday, 1);
  assert.equal(tracker.selectModelAndKey(100).model.id, 'hydrogen');
});

test('model-filtered requests cannot consume higher-tier quota', t => {
  const tracker = new ChatQuotaTracker(['a'], models, fixture(t));
  assert.equal(tracker.selectModelAndKey(100, ['flash']).model.id, 'flash');
  assert.equal(tracker.states.hydrogen, undefined);
});
