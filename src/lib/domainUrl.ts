// Project metadata uses the original domain. Keep matching links on the
// shorter domain when that is how the visitor reached the portfolio.
export function domainUrl(value: string): string {
  if (typeof window === 'undefined' || window.location.hostname !== 'projects.chrisb09.de') return value;

  try {
    const url = new URL(value);
    const oldDomain = 'christian-f-brinkmann.de';
    if (url.protocol === 'https:' && (url.hostname === oldDomain || url.hostname.endsWith(`.${oldDomain}`))) {
      url.hostname = `${url.hostname.slice(0, -oldDomain.length)}chrisb09.de`;
      return url.toString();
    }
  } catch {
    // Leave relative and non-URL values unchanged.
  }
  return value;
}
