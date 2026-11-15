'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { PaidBudget, reserveEstimate } = require('../chat-budget');

test('concurrent reservations persist, settle to actual cost, and respect the rolling cap', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-budget-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'budget.json');
  const budget = new PaidBudget(file, 0.1);
  const a = budget.reserve(0.04), b = budget.reserve(0.04);
  assert.ok(a && b);
  assert.equal(budget.reserve(0.03), null);
  budget.settle(a, 0.01);
  assert.ok(Math.abs(budget.spent() - 0.05) < 1e-9);
  const restarted = new PaidBudget(file, 0.1);
  assert.ok(Math.abs(restarted.spent() - 0.05) < 1e-9);
  assert.equal(restarted.entries.find(x => x.id === b).reserved, true);
  restarted.settle(b, undefined);
  assert.ok(Math.abs(restarted.spent() - 0.05) < 1e-9);
});

test('legacy paid usage migrates and corrupt state fails closed', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-budget-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const legacy = path.join(dir, 'legacy.json'), file = path.join(dir, 'budget.json');
  fs.writeFileSync(legacy, JSON.stringify({ paidTransactions: [{ timestamp: Date.now(), cost: 0.06 }] }));
  const budget = new PaidBudget(file, 0.1, legacy);
  assert.equal(budget.spent(), 0.06);
  assert.equal(budget.reserve(0.05), null);
  fs.writeFileSync(file, '{}');
  const broken = new PaidBudget(file, 0.1, legacy);
  assert.equal(broken.reserve(0.001), null);
});

test('reservation estimate bounds request size', () => {
  assert.ok(reserveEstimate({ messages: [{ content: 'hello' }], max_tokens: 1000 }, 0.3, 1.2) > 0);
  assert.equal(reserveEstimate({ content: 'a'.repeat(150001), max_tokens: 100 }, 0.3, 1.2), null);
});

test('separate processes cannot reserve the same remaining budget', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-budget-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'budget.json');
  new PaidBudget(file, 0.1);
  const modulePath = require.resolve('../chat-budget');
  const run = () => new Promise((resolve, reject) => {
    const script = `const {PaidBudget}=require(${JSON.stringify(modulePath)}); const b=new PaidBudget(${JSON.stringify(file)},0.1); console.log(b.reserve(0.06) ? 'reserved' : 'denied');`;
    const child = spawn(process.execPath, ['-e', script]);
    let out = ''; child.stdout.on('data', chunk => { out += chunk; });
    child.on('error', reject); child.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(`child exited ${code}`)));
  });
  const results = await Promise.all([run(), run()]);
  assert.deepEqual(results.sort(), ['denied', 'reserved']);
  assert.equal(new PaidBudget(file, 0.1).spent(), 0.06);
});
