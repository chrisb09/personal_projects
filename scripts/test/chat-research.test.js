'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { researchPortfolio } = require('../chat-research');

test('two researchers execute read-only tools concurrently and return findings', async () => {
  const seen = [], declarations = [{ name: 'read_repo_file', parameters: { type: 'object' } }, { name: 'write_file', parameters: { type: 'object' } }];
  const calls = new Map();
  const result = await researchPortfolio(['A', 'B'], {
    declarations,
    request: async ({ messages, tools }) => {
      const task = messages[1].content;
      if (tools) assert.deepEqual(tools.map(x => x.function.name), ['read_repo_file']);
      const count = calls.get(task) || 0; calls.set(task, count + 1);
      return count === 0 ? { role: 'assistant', tool_calls: [{ id: task, function: { name: 'read_repo_file', arguments: '{"filePath":"README.md"}' } }] } : { role: 'assistant', content: `${task}: evidence in README.md` };
    },
    execute: async (name, args) => { seen.push([name, args.filePath]); return { content: 'fact' }; },
  });
  assert.equal(result.results.length, 2);
  assert.equal(seen.length, 2);
  assert.match(result.results[0].findings, /README/);
});

test('worker denies unlisted tools, excessive tasks, and repeated calls', async () => {
  let executed = 0;
  const opts = {
    declarations: [{ name: 'read_repo_file', parameters: { type: 'object' } }],
    request: async () => ({ role: 'assistant', tool_calls: [{ id: 'bad', function: { name: 'write_file', arguments: '{}' } }] }),
    execute: async () => { executed++; },
  };
  assert.ok((await researchPortfolio(['a', 'b', 'c'], opts)).error);
  const result = await researchPortfolio(['a'], opts);
  assert.equal(executed, 0);
  assert.match(result.results[0].error, /limit/);
});
