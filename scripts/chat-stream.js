'use strict';

// Provider SSE frames may be split at any byte boundary, including UTF-8.
async function* readEvents(body) {
  if (!body) throw new Error('Provider returned an empty stream');
  const decoder = new TextDecoder();
  let pending = '';
  for await (const bytes of body) {
    pending += decoder.decode(bytes, { stream: true });
    if (pending.length > 4 * 1024 * 1024) throw new Error('Provider stream frame too large');
    let end;
    while ((end = pending.search(/\r?\n\r?\n/)) !== -1) {
      const frame = pending.slice(0, end);
      const separator = pending.slice(end).match(/^\r?\n\r?\n/)[0];
      pending = pending.slice(end + separator.length);
      const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).replace(/^ /, '')).join('\n');
      if (!data || data === '[DONE]') continue;
      yield JSON.parse(data);
    }
  }
  pending += decoder.decode();
  if (pending.trim()) throw new Error('Provider stream ended with an incomplete frame');
}

// Hold a small suffix so a protocol marker split across provider chunks is
// never written to the browser. Fail closed instead of exposing tool results.
function createTextGate(write) {
  let pending = '';
  let emitted = false;
  const marker = /response\s*:\s*(?:default_api\s*:|(?:functions?|tool)\s*:)|<\|(?:tool|function)|<(?:tool_call|function_call)\b/i;
  return {
    push(text) {
      pending += text;
      if (marker.test(pending)) throw new Error('Provider returned internal tool protocol instead of an answer');
      if (pending.length > 64) {
        const safe = pending.slice(0, -64);
        pending = pending.slice(-64);
        write(safe);
        emitted = true;
      }
    },
    finish() {
      if (marker.test(pending)) throw new Error('Provider returned internal tool protocol instead of an answer');
      if (pending) { write(pending); emitted = true; pending = ''; }
    },
    get emitted() { return emitted; },
  };
}

function answerGate(res) {
  let firstTokenTime = null;
  const gate = createTextGate(text => {
    if (res.destroyed) throw new Error('Client disconnected');
    if (!firstTokenTime) firstTokenTime = Date.now();
    res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
    res.answerStarted = true;
  });
  return { gate, firstTokenTime: () => firstTokenTime };
}

async function readOpenAIStream(resp, res) {
  const { gate, firstTokenTime } = answerGate(res);
  const calls = new Map();
  let content = '', usage = null, finishReason = null, done = false;
  for await (const event of readEvents(resp.body)) {
    if (event.error) throw new Error('Provider stream failed');
    if (event.usage) usage = event.usage;
    const choice = event.choices?.[0];
    if (!choice) continue;
    if (choice.finish_reason) { finishReason = choice.finish_reason; done = true; }
    const delta = choice.delta || {};
    if (delta.tool_calls?.length && gate.emitted) throw new Error('Provider mixed answer text and tool calls');
    for (const call of delta.tool_calls || []) {
      const current = calls.get(call.index) || { id: '', type: 'function', function: { name: '', arguments: '' } };
      if (call.id) current.id += call.id;
      if (call.function?.name) current.function.name += call.function.name;
      if (call.function?.arguments) current.function.arguments += call.function.arguments;
      calls.set(call.index, current);
    }
    if (typeof delta.content === 'string' && !calls.size) {
      content += delta.content;
      gate.push(delta.content);
    }
  }
  if (!done) throw new Error('Provider stream ended before completion');
  if (finishReason === 'length' || finishReason === 'content_filter') throw new Error('Provider could not complete the answer');
  if (!calls.size && content) gate.finish();
  return { message: { role: 'assistant', content: content || null, ...(calls.size ? { tool_calls: [...calls.values()] } : {}) }, usage, firstTokenTime: firstTokenTime() };
}

async function readGeminiStream(resp, res) {
  const { gate, firstTokenTime } = answerGate(res);
  const parts = [];
  let usageMetadata = null, finishReason = null, content = '';
  for await (const event of readEvents(resp.body)) {
    if (event.error) throw new Error('Provider stream failed');
    if (event.usageMetadata) usageMetadata = event.usageMetadata;
    const candidate = event.candidates?.[0];
    if (!candidate) continue;
    if (candidate.finishReason) finishReason = candidate.finishReason;
    for (const part of candidate.content?.parts || []) {
      parts.push(part);
      if (part.functionCall && gate.emitted) throw new Error('Provider mixed answer text and tool calls');
      if (part.text && !part.thought && !parts.some(p => p.functionCall)) {
        content += part.text;
        gate.push(part.text);
      }
    }
  }
  if (!finishReason || finishReason !== 'STOP') throw new Error('Provider could not complete the answer');
  if (!parts.some(p => p.functionCall) && content) gate.finish();
  return { candidates: [{ content: { parts } }], usageMetadata, firstTokenTime: firstTokenTime() };
}


module.exports = { readEvents, createTextGate, readOpenAIStream, readGeminiStream };
