export function isTvBackKey(key: string): boolean {
  return key === "Escape" || key === "Backspace" || key === "BrowserBack" || key === "GoBack";
}

const TV_PROFILE_ROOT = /^\/user\/([^/]+)\/?$/;

function normalizePathname(pathname: string): string {
  return pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
}

/** Main tabs where Back focuses the topbar first, then offers to quit (TV). */
export function isTvTopbarBackRoot(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (path === "/movies" || path === "/tv" || path === "/downloads") return true;
  return TV_PROFILE_ROOT.test(path);
}

/** Whether spatial-nav focus is on a topbar control (TV). */
export function isTvFocusInTopbar(documentRef: Document = document): boolean {
  const topbar = documentRef.querySelector('[data-slot="app-topbar"]');
  if (!(topbar instanceof HTMLElement)) return false;
  return topbar.querySelector('[data-tv-focused="true"]') !== null;
}

export function resolveTvTopbarBackFocusKey(pathname: string): string | null {
  const path = normalizePathname(pathname);
  if (path === "/movies") return "NAV-/movies";
  if (path === "/tv") return "NAV-/tv";
  if (path === "/downloads") return "NAV-/downloads";
  const profileMatch = path.match(TV_PROFILE_ROOT);
  if (profileMatch?.[1]) return `NAV-/user/$id-${profileMatch[1]}`;
  return null;
}

/** Best-effort exit (WebView / kiosk / tab). */
export function exitSeedarrApplication(): void {
  window.close();
  window.setTimeout(() => {
    if (typeof window.history.length === "number" && window.history.length > 1) {
      window.history.go(1 - window.history.length);
    }
    window.location.replace("about:blank");
  }, 50);
}
