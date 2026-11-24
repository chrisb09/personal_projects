// URL controls for the portfolio AI assistant.
//
//   ?chat=open        opens the assistant
//   ?chatInput=<text> pre-fills the composer; also opens the assistant
//
// The parameters only open/pre-fill the composer. They never send a message.
export const CHAT_OPEN_PARAM = 'chat';
export const CHAT_OPEN_VALUE = 'open';
export const CHAT_INPUT_PARAM = 'chatInput';

export interface ChatRoute {
  open: boolean;
  input: string;
}

export function parseChatRoute(queryString: string): ChatRoute {
  const params = new URLSearchParams(queryString);
  const input = params.get(CHAT_INPUT_PARAM) ?? '';
  const open = params.get(CHAT_OPEN_PARAM) === CHAT_OPEN_VALUE || input.trim().length > 0;

  return { open, input: open ? input : '' };
}

export function removeChatRouteParams(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(CHAT_OPEN_PARAM);
  params.delete(CHAT_INPUT_PARAM);
  return params.toString();
}

// Consumed deep-link parameters are removed when the assistant is closed so a
// reload does not reopen it. Project, tab, filter and search parameters remain.
export function clearChatRouteParams(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  if (!params.has(CHAT_OPEN_PARAM) && !params.has(CHAT_INPUT_PARAM)) return;

  const query = removeChatRouteParams(window.location.search);
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}
