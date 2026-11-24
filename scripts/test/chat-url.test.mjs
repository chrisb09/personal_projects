'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearChatRouteParams,
  parseChatRoute,
  removeChatRouteParams,
} from '../../src/lib/chatUrl.ts';

test('keeps the assistant closed without chat URL controls', () => {
  assert.deepEqual(parseChatRoute(''), { open: false, input: '' });
  assert.deepEqual(parseChatRoute('?project=demo&tab=technical&q=python'), {
    open: false,
    input: '',
  });
});

test('opens the assistant with chat=open', () => {
  assert.deepEqual(parseChatRoute('?chat=open'), { open: true, input: '' });
  assert.deepEqual(parseChatRoute('?project=demo&chat=open'), {
    open: true,
    input: '',
  });
});

test('pre-fills the composer and opens the assistant', () => {
  assert.deepEqual(
    parseChatRoute('?chat=open&chatInput=Which%20projects%20use%20C%2B%2B%3F'),
    { open: true, input: 'Which projects use C++?' }
  );
  assert.deepEqual(parseChatRoute('?chatInput=Hello+world'), {
    open: true,
    input: 'Hello world',
  });
});

test('ignores unsupported values and empty pre-fills', () => {
  assert.deepEqual(parseChatRoute('?chat=true'), { open: false, input: '' });
  assert.deepEqual(parseChatRoute('?chat=closed&chatInput='), {
    open: false,
    input: '',
  });
  assert.deepEqual(parseChatRoute('?chatInput=%20%20'), {
    open: false,
    input: '',
  });
});

test('removes only the chat URL controls', () => {
  const cleaned = removeChatRouteParams(
    '?project=demo&chat=open&tab=technical&chatInput=Hi&q=python'
  );
  const params = new URLSearchParams(cleaned);

  assert.equal(params.get('project'), 'demo');
  assert.equal(params.get('tab'), 'technical');
  assert.equal(params.get('q'), 'python');
  assert.equal(params.has('chat'), false);
  assert.equal(params.has('chatInput'), false);
});

test('clears consumed chat parameters from the browser URL on close', () => {
  const originalWindow = globalThis.window;
  const replaced = [];
  globalThis.window = {
    location: {
      pathname: '/portfolio',
      search: '?chat=open&project=demo&chatInput=Hi',
      hash: '#top',
    },
    history: {
      replaceState: (_state, _title, url) => replaced.push(url),
    },
  };

  try {
    clearChatRouteParams();
    assert.deepEqual(replaced, ['/portfolio?project=demo#top']);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('does not rewrite the URL when no chat parameters were consumed', () => {
  const originalWindow = globalThis.window;
  const replaced = [];
  globalThis.window = {
    location: {
      pathname: '/portfolio',
      search: '?project=demo&tab=technical',
      hash: '',
    },
    history: {
      replaceState: (_state, _title, url) => replaced.push(url),
    },
  };

  try {
    clearChatRouteParams();
    assert.deepEqual(replaced, []);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
