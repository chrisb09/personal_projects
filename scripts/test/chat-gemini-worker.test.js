'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { toGemini, fromGemini } = require('../chat-gemini-worker');

test('Gemini worker preserves model parts and thought signatures across tool responses', () => {
  const parts = [{ functionCall: { name: 'read_repo_file', args: { repoName: 'example', filePath: 'README.md' } }, thoughtSignature: 'opaque-signature' }];
  const reply = fromGemini({ candidates: [{ finishReason: 'STOP', content: { parts } }] });
  assert.equal(reply.tool_calls[0].function.name, 'read_repo_file');
  const body = toGemini([{ role: 'system', content: 'research only' }, { role: 'user', content: 'find evidence' }, reply, { role: 'tool', name: 'read_repo_file', content: '{"fact":"value"}' }], []);
  assert.deepEqual(body.contents[1].parts, parts);
  assert.equal(body.contents[2].parts[0].functionResponse.name, 'read_repo_file');
  assert.equal(body.contents[2].parts[0].functionResponse.response.content, '{"fact":"value"}');
});

test('Gemini worker ignores internal thoughts and rejects incomplete answers', () => {
  assert.equal(fromGemini({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'partial' }] } }] }), null);
  const result = fromGemini({ candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'hidden' }, { text: 'evidence' }] } }] });
  assert.equal(result.content, 'evidence');
});
