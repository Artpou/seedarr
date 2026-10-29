import type { MoviPlayerHandle } from "@/features/player/helpers/movi-player.helper";

const TV_MOVI_CONTROL_FOCUS_CLASS = "seedarr-tv-control-focus";

/** Left-to-right order in the movi control bar (hidden items are skipped). */
const TV_BAR_FOCUS_SELECTORS = [
  ".movi-play-pause",
  ".movi-seek-backward",
  ".movi-seek-forward",
  ".movi-audio-track-btn",
  ".movi-subtitle-track-btn",
  ".movi-quality-btn",
  ".movi-hdr-btn",
  ".movi-speed-btn",
  ".movi-stable-audio-btn",
  ".movi-aspect-ratio-btn",
  ".movi-more-btn",
] as const;

type MoviChrome = MoviPlayerHandle & {
  showControls?: () => void;
  hideControls?: () => void;
};

export function showMoviControlBar(player: MoviPlayerHandle): void {
  (player as MoviChrome).showControls?.();
}

export function hideMoviControlBar(player: MoviPlayerHandle): void {
  (player as MoviChrome).hideControls?.();
}

export function injectTvMoviControlFocusStyle(player: MoviPlayerHandle, ringColor?: string): void {
  const root = player.shadowRoot;
  if (!root || root.getElementById("seedarr-tv-movi-focus-style")) return;

  const fromTheme = player.getAttribute("themecolor")?.trim();
  const fromDoc = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const ring = ringColor || fromTheme || fromDoc || "#4ade80";

  const style = document.createElement("style");
  style.id = "seedarr-tv-movi-focus-style";
  style.textContent = `
    /* movi-player resets outlines/shadows on * — TV ring must override with !important */
    .movi-controls-container .movi-btn.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-controls-container .movi-btn[data-seedarr-tv-focus="true"],
    .movi-subtitle-track-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-audio-track-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-speed-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-quality-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .seedarr-tv-cc-menu-btn.${TV_MOVI_CONTROL_FOCUS_CLASS},
    [data-seedarr-cc-extras] button.${TV_MOVI_CONTROL_FOCUS_CLASS} {
      border: 2px solid ${ring} !important;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.85), 0 0 14px color-mix(in srgb, ${ring} 70%, transparent) !important;
      background-color: rgba(255, 255, 255, 0.14) !important;
      z-index: 3;
      position: relative;
    }
    .movi-controls-container .movi-btn.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-controls-container .movi-btn[data-seedarr-tv-focus="true"] {
      transform: scale(1.1);
    }
    .movi-subtitle-track-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-audio-track-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-speed-item.${TV_MOVI_CONTROL_FOCUS_CLASS},
    .movi-quality-item.${TV_MOVI_CONTROL_FOCUS_CLASS} {
      border-radius: 0.35rem;
    }
  `;
  root.appendChild(style);
}

/** Wider CC panel + readable track rows on TV. */
export function injectTvSubtitleMenuLayoutStyle(player: MoviPlayerHandle): void {
  const root = player.shadowRoot;
  if (!root || root.getElementById("seedarr-tv-subtitle-menu-style")) return;

  const style = document.createElement("style");
  style.id = "seedarr-tv-subtitle-menu-style";
  style.textContent = `
    .movi-subtitle-track-menu {
      min-width: min(32rem, 94vw) !important;
      width: min(32rem, 94vw) !important;
      max-width: 94vw !important;
    }
    .movi-subtitle-track-menu .movi-subtitle-track-header {
      padding: 0.65rem 0.85rem !important;
      font-size: 0.8rem !important;
      letter-spacing: 0.06em !important;
    }
    .movi-subtitle-track-item {
      padding: 0.7rem 0.85rem !important;
      min-height: 2.85rem !important;
      font-size: 0.92rem !important;
    }
    .movi-subtitle-track-label {
      font-size: 0.92rem !important;
    }
    .movi-subtitle-track-footer {
      padding: 0.4rem 0.85rem 0.55rem !important;
      font-size: 0.8rem !important;
    }
    [data-seedarr-cc-extras] {
      padding: 0.55rem 0.65rem 0.7rem !important;
      gap: 0.55rem !important;
    }
    [data-seedarr-cc-extras] > button.seedarr-tv-cc-menu-btn {
      min-height: 2.85rem !important;
      font-size: 0.95rem !important;
    }
    [data-seedarr-delay-controls] button.seedarr-tv-cc-menu-btn {
      min-height: 2.5rem !important;
    }
  `;
  root.appendChild(style);
}

function isVisibleBarControl(el: HTMLElement): boolean {
  if (el.closest(".movi-volume-container") || el.closest(".movi-time")) return false;
  if (el.classList.contains("movi-progress-bar") || el.classList.contains("movi-live-badge")) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function listTvMoviBarControls(player: MoviPlayerHandle): HTMLElement[] {
  const root = player.shadowRoot;
  if (!root) return [];

  const items: HTMLElement[] = [];
  for (const selector of TV_BAR_FOCUS_SELECTORS) {
    const el = root.querySelector<HTMLElement>(selector);
    if (el && isVisibleBarControl(el)) items.push(el);
  }
  return items;
}

const TV_BOTTOM_MENU_SELECTORS = [
  ".movi-speed-menu",
  ".movi-audio-track-menu",
  ".movi-subtitle-track-menu",
  ".movi-quality-menu",
] as const;

function applyTvMoviFocus(el: HTMLElement): void {
  el.classList.add(TV_MOVI_CONTROL_FOCUS_CLASS);
  el.setAttribute("data-seedarr-tv-focus", "true");
}

export function clearTvMoviControlFocus(player: MoviPlayerHandle): void {
  const root = player.shadowRoot;
  if (!root) return;
  root.querySelectorAll(`.${TV_MOVI_CONTROL_FOCUS_CLASS}, [data-seedarr-tv-focus="true"]`).forEach((node) => {
    node.classList.remove(TV_MOVI_CONTROL_FOCUS_CLASS);
    node.removeAttribute("data-seedarr-tv-focus");
  });
}

export function getOpenTvMoviMenu(player: MoviPlayerHandle): HTMLElement | null {
  const root = player.shadowRoot;
  if (!root) return null;

  for (const selector of TV_BOTTOM_MENU_SELECTORS) {
    const menu = root.querySelector<HTMLElement>(selector);
    if (menu?.classList.contains("is-open")) return menu;
  }
  return null;
}

export function closeOpenTvMoviMenus(player: MoviPlayerHandle): void {
  const root = player.shadowRoot;
  if (!root) return;

  const pairs: Array<[string, string]> = [
    [".movi-subtitle-track-menu", ".movi-subtitle-track-btn"],
    [".movi-audio-track-menu", ".movi-audio-track-btn"],
    [".movi-speed-menu", ".movi-speed-btn"],
    [".movi-quality-menu", ".movi-quality-btn"],
  ];

  for (const [menuSelector, buttonSelector] of pairs) {
    const menu = root.querySelector<HTMLElement>(menuSelector);
    if (!menu?.classList.contains("is-open")) continue;
    root.querySelector<HTMLElement>(buttonSelector)?.click();
    return;
  }
}

function listTvMoviMenuItems(menu: HTMLElement): HTMLElement[] {
  const items: HTMLElement[] = [];
  const nodes = menu.querySelectorAll<HTMLElement>(
    ".movi-subtitle-track-item, .movi-audio-track-item, .movi-speed-item, .movi-quality-item, [data-seedarr-cc-extras] button",
  );
  for (const el of nodes) {
    if (isVisibleBarControl(el)) items.push(el);
  }
  return items;
}

/** Move focus between delay − / + / 0 buttons (same row). */
export function moveTvMoviMenuFocusHorizontal(player: MoviPlayerHandle, direction: -1 | 1): boolean {
  const menu = getOpenTvMoviMenu(player);
  if (!menu) return false;

  const focused = menu.querySelector<HTMLElement>("[data-seedarr-tv-focus='true']");
  if (!focused) return false;

  const row = focused.closest<HTMLElement>("[data-seedarr-delay-row]");
  if (!row) return false;

  const buttons = [...row.querySelectorAll<HTMLElement>("button[data-seedarr-cc-focus]")];
  const index = buttons.indexOf(focused);
  if (index < 0) return false;

  const next = buttons[index + direction];
  if (!next) return false;

  clearTvMoviControlFocus(player);
  applyTvMoviFocus(next);
  next.scrollIntoView({ block: "nearest", inline: "nearest" });
  return true;
}

/** Keep menu focus index aligned after horizontal moves in the delay row. */
export function syncTvMoviMenuFocusIndex(player: MoviPlayerHandle): number {
  const menu = getOpenTvMoviMenu(player);
  if (!menu) return -1;
  const focused = menu.querySelector<HTMLElement>("[data-seedarr-tv-focus='true']");
  if (!focused) return -1;
  const items = listTvMoviMenuItems(menu);
  const index = items.indexOf(focused);
  return index;
}

export function getFocusedTvMoviMenuButton(player: MoviPlayerHandle): HTMLButtonElement | null {
  const menu = getOpenTvMoviMenu(player);
  if (!menu) return null;
  const focused = menu.querySelector<HTMLElement>("[data-seedarr-tv-focus='true']");
  return focused instanceof HTMLButtonElement ? focused : null;
}

export function focusTvMoviMenuItem(player: MoviPlayerHandle, index: number): number {
  const menu = getOpenTvMoviMenu(player);
  if (!menu) return -1;

  const items = listTvMoviMenuItems(menu);
  if (!items.length) return -1;

  const clamped = Math.max(0, Math.min(index, items.length - 1));
  clearTvMoviControlFocus(player);
  const el = items[clamped];
  applyTvMoviFocus(el);
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
  return clamped;
}

export function activateTvMoviMenuItem(player: MoviPlayerHandle, index: number): void {
  const menu = getOpenTvMoviMenu(player);
  if (!menu) return;
  const items = listTvMoviMenuItems(menu);
  items[index]?.click();
}

export function focusTvMoviBarControl(player: MoviPlayerHandle, index: number): number {
  const controls = listTvMoviBarControls(player);
  if (!controls.length) return -1;

  const clamped = Math.max(0, Math.min(index, controls.length - 1));
  clearTvMoviControlFocus(player);
  const el = controls[clamped];
  applyTvMoviFocus(el);
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
  return clamped;
}

export function activateTvMoviBarControl(player: MoviPlayerHandle, index: number): void {
  const controls = listTvMoviBarControls(player);
  const el = controls[index];
  if (!el) return;
  el.click();
}
