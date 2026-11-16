'use strict';

// Convert the internal worker transcript to Gemini's function-call protocol.
// Original model parts are retained verbatim, including thought signatures.
function toGemini(messages, tools) {
  const system = messages.filter(m => m.role === 'system').map(m => String(m.content || '')).join('\n');
  const contents = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    if (m.role === 'tool') {
      const part = { functionResponse: { name: m.name, response: { content: String(m.content || '') } } };
      const last = contents[contents.length - 1];
      if (last?.role === 'user' && last.parts.every(p => p.functionResponse)) last.parts.push(part);
      else contents.push({ role: 'user', parts: [part] });
    } else if (m.role === 'assistant') {
      contents.push({ role: 'model', parts: m.geminiParts || [{ text: String(m.content || '') }] });
    } else contents.push({ role: 'user', parts: [{ text: String(m.content || '') }] });
  }
  return {
    systemInstruction: { parts: [{ text: system }] }, contents,
    generationConfig: { maxOutputTokens: 4096 },
    ...(tools?.length ? { tools: [{ functionDeclarations: tools.map(t => t.function) }] } : {}),
  };
}

function fromGemini(data) {
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP' || !Array.isArray(candidate?.content?.parts)) return null;
  const parts = candidate.content.parts;
  const calls = parts.filter(p => p.functionCall).map((p, i) => ({
    id: `gemini-call-${i}`, type: 'function',
    function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args || {}) },
  }));
  return { role: 'assistant', content: parts.filter(p => p.text && !p.thought).map(p => p.text).join(''), geminiParts: parts, ...(calls.length ? { tool_calls: calls } : {}) };
}

module.exports = { toGemini, fromGemini };
