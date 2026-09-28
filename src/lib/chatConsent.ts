const COOKIE_NAME = 'portfolio_chat_consent';
const LOCAL_STORAGE_KEY = 'portfolio_chat_consent_v1';
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60; // 180 days in seconds

const isBrowser = typeof window !== 'undefined';

function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (!isBrowser) return;
  document.cookie = `${name}=${value};path=/;max-age=${maxAgeSeconds};SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (!isBrowser) return;
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
}

export function hasChatConsent(): boolean {
  if (!isBrowser) return false;
  const cookieVal = getCookie(COOKIE_NAME);
  if (cookieVal === 'accepted') return true;

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local === 'accepted') {
      setCookie(COOKIE_NAME, 'accepted', COOKIE_MAX_AGE);
      return true;
    }
  } catch {}

  return false;
}

export function grantChatConsent(): void {
  if (!isBrowser) return;
  setCookie(COOKIE_NAME, 'accepted', COOKIE_MAX_AGE);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'accepted');
  } catch {}
}

export function revokeChatConsent(): void {
  if (!isBrowser) return;
  deleteCookie(COOKIE_NAME);
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}
}
