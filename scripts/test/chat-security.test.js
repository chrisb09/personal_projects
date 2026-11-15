'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the same guards used by the read-only tools without starting a
// server or loading the deployment's credentials.
const source = fs.readFileSync(path.join(__dirname, '../chat-server.js'), 'utf8');
const start = source.indexOf('const FORBIDDEN_PATTERNS =');
const end = source.indexOf('// =====================================================================\n// Image Helpers', start);
if (start < 0 || end < 0) throw new Error('Could not locate chat security guards');
const guards = vm.runInNewContext(`${source.slice(start, end)}\n({ isSafeFilePath, redactSensitiveContent })`, { path });

test('file guard rejects nested environment files, SQLite and secret paths', () => {
  for (const name of ['.env', 'nested/.env.local', 'tasks.sqlite3', 'tasks.db-wal', 'discord/webhook-secret.txt', 'ssh/id_rsa']) {
    assert.equal(guards.isSafeFilePath(name), false, name);
  }
  assert.equal(guards.isSafeFilePath('src/server.js'), true);
});

test('redaction removes unquoted and quoted secrets rather than just string literals', () => {
  const result = guards.redactSensitiveContent('DISCORD_WEBHOOK_URL=https://example.test/secret\npassword=example\npublic explanation');
  assert.equal(result, '[redacted sensitive line]\n[redacted sensitive line]\npublic explanation');
});
