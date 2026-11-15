'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { readEvents, createTextGate, readOpenAIStream, readGeminiStream } = require('../chat-stream');

const frame = value => `data: ${JSON.stringify(value)}\n\n`;
const response = () => ({ output: [], write(s) { this.output.push(JSON.parse(s.slice(6))); } });

test('SSE parser handles fragmented UTF-8, multiline frames, and multiple events', async () => {
  const bytes = Buffer.from('data: {"text":\ndata: "Grüße"}\r\n\r\ndata: [DONE]\n\n');
  const chunks = [...bytes].map(b => Buffer.from([b]));
  const events = [];
  for await (const event of readEvents(Readable.from(chunks))) events.push(event);
  assert.deepEqual(events, [{ text: 'Grüße' }]);
});

test('text gate blocks a protocol marker split across chunks', () => {
  let output = '';
  const gate = createTextGate(s => { output += s; });
  gate.push('response:def');
  assert.throws(() => gate.push('ault_api:read_personal_context{content:secret}'), /internal tool protocol/);
  assert.equal(output, '');
});

test('OpenAI text is emitted before the provider finishes', async () => {
  const res = response();
  let release;
  const paused = new Promise(resolve => { release = resolve; });
  async function* body() {
    yield Buffer.from(frame({ choices: [{ delta: { content: 'First '.repeat(20) } }] }));
    await paused;
    yield Buffer.from(frame({ choices: [{ delta: { content: 'end' }, finish_reason: 'stop' }] }));
  }
  const result = readOpenAIStream({ body: body() }, res);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(res.output[0].type, 'delta');
  release();
  const data = await result;
  assert.equal(data.message.content, 'First '.repeat(20) + 'end');
  assert.equal(res.output.map(e => e.text).join(''), data.message.content);
});

test('OpenAI tool calls are reassembled without exposing arguments', async () => {
  const res = response();
  const chunks = [
    { choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'read_personal_', arguments: '{"document' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'context', arguments: 'Name":"bio"}' } }] }, finish_reason: 'tool_calls' }] },
  ];
  const result = await readOpenAIStream({ body: Readable.from(chunks.map(x => Buffer.from(frame(x)))) }, res);
  assert.equal(result.message.tool_calls[0].function.name, 'read_personal_context');
  assert.deepEqual(JSON.parse(result.message.tool_calls[0].function.arguments), { documentName: 'bio' });
  assert.deepEqual(res.output, []);
});

test('OpenRouter preserves streamed reasoning details for tool continuation and captures usage', async () => {
  const res = response();
  const chunks = [
    { choices: [{ delta: { reasoning_details: [{ type: 'reasoning.text', text: 'one', index: 0 }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, id: 'c', function: { name: 'list_projects', arguments: '{}' } }], reasoning_details: [{ type: 'reasoning.text', text: 'two', index: 0 }] }, finish_reason: 'tool_calls' }] },
    { choices: [], usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0.00001 } },
  ];
  const result = await readOpenAIStream({ body: Readable.from(chunks.map(x => Buffer.from(frame(x)))) }, res);
  assert.deepEqual(result.message.reasoning_details.map(x => x.text), ['one', 'two']);
  assert.equal(result.usage.cost, 0.00001);
  assert.deepEqual(res.output, []);
});

test('Gemini streams text and retains structured tool calls', async () => {
  const res = response();
  const chunks = [
    { candidates: [{ content: { parts: [{ text: 'Answer '.repeat(15) }] } }] },
    { candidates: [{ content: { parts: [{ text: 'done' }] }, finishReason: 'STOP' }], usageMetadata: { candidatesTokenCount: 10 } },
  ];
  const result = await readGeminiStream({ body: Readable.from(chunks.map(x => Buffer.from(frame(x)))) }, res);
  assert.equal(res.output.map(e => e.text).join(''), 'Answer '.repeat(15) + 'done');
  assert.equal(result.usageMetadata.candidatesTokenCount, 10);
  const toolRes = response();
  const tool = { candidates: [{ content: { parts: [{ functionCall: { name: 'read_personal_context', args: { documentName: 'bio' } } }] }, finishReason: 'STOP' }] };
  const toolResult = await readGeminiStream({ body: Readable.from([Buffer.from(frame(tool))]) }, toolRes);
  assert.equal(toolResult.candidates[0].content.parts[0].functionCall.name, 'read_personal_context');
  assert.deepEqual(toolRes.output, []);
});

test('incomplete provider streams fail rather than silently completing', async () => {
  const res = response();
  await assert.rejects(readOpenAIStream({ body: Readable.from([Buffer.from(frame({ choices: [{ delta: { content: 'partial' } }] }))]) }, res), /before completion/);
  assert.deepEqual(res.output, []);
});
