type Theme = 'light' | 'dark' | 'system';

const COOKIE_NAME = 'theme';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme {
  const stored = getCookie(COOKIE_NAME);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  setCookie(COOKIE_NAME, theme);
}

export function initializeTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Listen for system theme changes when in 'system' mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = getStoredTheme();
    if (current === 'system') {
      applyTheme('system');
    }
  });
}
