export interface MoviPlayerHandle extends HTMLElement {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  play: () => Promise<void>;
  pause: () => void;
  volume: number;
  muted: boolean;
  subtitleDelay: number;
  /** External VTT/SRT tracks registered via `source({ subtitles })`. `null` turns them off. */
  selectSubtitleLang?: (lang: string | null) => Promise<boolean> | boolean;
  source?: (value: {
    video: { src: string };
    subtitles?: Array<{ src: string; lang: string; label: string; format?: string }>;
  }) => void;
}

type CcExtrasOpts = {
  onAddSubtitles?: () => void;
  enableDelay?: boolean;
  initialSubtitleDelay?: number;
  preferredSubtitleTrackSrc?: string | null;
  tracks?: SubtitlePreferenceTrack[];
  onSubtitlePreferencesChange?: (prefs: SubtitlePreferences) => void;
  /** Larger controls + TV menu focus targets in the CC panel. */
  tv?: boolean;
  labels?: {
    delay: string;
    delayReset?: string;
    addSubtitles: string;
    off: string;
    noTracks: string;
  };
};

export type SubtitlePreferenceTrack = { src: string; srclang: string; label: string };

type SubtitlePreferences = {
  subtitleDelay: number;
  subtitleTrackSrc: string | null;
};

const REPEAT_INITIAL_MS = 400;
const REPEAT_INTERVAL_MS = 80;

function attachHoldRepeat(btn: HTMLButtonElement, action: () => void, onPointerStart?: () => void): void {
  let intervalId: number | undefined;
  let timeoutId: number | undefined;

  const stop = (): void => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (intervalId !== undefined) window.clearInterval(intervalId);
    timeoutId = undefined;
    intervalId = undefined;
  };

  const start = (event: Event): void => {
    event.stopPropagation();
    onPointerStart?.();
    action();
    stop();
    timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(action, REPEAT_INTERVAL_MS);
    }, REPEAT_INITIAL_MS);
  };

  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointerleave", stop);
  btn.addEventListener("pointercancel", stop);
}

const DEFAULT_CC_LABELS = {
  delay: "Delay",
  addSubtitles: "Add subtitles",
  off: "Off",
  noTracks: "No subtitle tracks available",
} as const;

let moviPlayerImport: Promise<void> | null = null;

/**
 * movi-player 0.3.x calls `this.setAttribute("tabindex", "0")` from createControls()
 * inside the custom element constructor. The HTML spec forbids gaining attributes during
 * construction, so `document.createElement("movi-player")` throws NotSupportedError.
 * Defer tabindex writes until after construction completes.
 */
function patchMoviPlayerTabIndex(): void {
  const Ctor = customElements.get("movi-player") as
    | (CustomElementConstructor & { __seedarrTabIndexPatched?: boolean })
    | undefined;
  if (!Ctor || Ctor.__seedarrTabIndexPatched) return;

  const original = Ctor.prototype.setAttribute;
  Ctor.prototype.setAttribute = function (this: HTMLElement, name: string, value: string) {
    if (name === "tabindex") {
      queueMicrotask(() => {
        original.call(this, name, value);
      });
      return;
    }
    return original.call(this, name, value);
  };
  Ctor.__seedarrTabIndexPatched = true;
}

/** Warm the ~10 MB movi-player chunk in the background (hover / route preload). */
export function preloadMoviPlayer(): void {
  void ensureMoviPlayerRegistered().catch(() => {
    // Best-effort prefetch — Player will surface errors on mount.
  });
}

/** Load + register `<movi-player>` once; shared by preload and Player mount. */
export function ensureMoviPlayerRegistered(): Promise<void> {
  if (customElements.get("movi-player")) {
    patchMoviPlayerTabIndex();
    return Promise.resolve();
  }
  if (!moviPlayerImport) {
    moviPlayerImport = import("movi-player")
      .then(() => {
        patchMoviPlayerTabIndex();
      })
      .catch((err) => {
        moviPlayerImport = null;
        throw err;
      });
  }
  return moviPlayerImport;
}

export function errorDetail(event: Event): unknown {
  return event instanceof CustomEvent ? event.detail : event;
}

function readActiveSubtitleTrackSrc(player: MoviPlayerHandle, tracks: SubtitlePreferenceTrack[]): string | null {
  const root = player.shadowRoot;
  if (!root) return null;

  const active = [...root.querySelectorAll<HTMLElement>(".movi-subtitle-track-item")].find((el) =>
    el.classList.contains("movi-subtitle-track-active"),
  );
  if (!active || active.dataset.trackId === "null") return null;

  // External tracks (source().subtitles) use data-subtitle-lang, not data-track-id.
  const subtitleLang = active.dataset.subtitleLang ?? "";
  if (subtitleLang) {
    const byLang = tracks.find((t) => t.srclang === subtitleLang);
    if (byLang) return byLang.src;
  }

  const label = active.querySelector(".movi-subtitle-track-label")?.textContent?.trim();
  if (label) {
    const byLabel = tracks.find((t) => t.label === label);
    if (byLabel) return byLabel.src;
  }

  return null;
}

export function subtitleTrackSrcMatches(stored: string, candidate: string): boolean {
  if (stored === candidate) return true;
  try {
    if (decodeURIComponent(stored) === decodeURIComponent(candidate)) return true;
  } catch {
    // ignore malformed sequences
  }
  const tail = (value: string): string => {
    const marker = "/subtitles/";
    const index = value.indexOf(marker);
    return index >= 0 ? value.slice(index + marker.length) : value;
  };
  const a = tail(stored);
  const b = tail(candidate);
  if (a === b) return true;
  try {
    return decodeURIComponent(a) === decodeURIComponent(b);
  } catch {
    return false;
  }
}

function findPreferenceTrack(tracks: SubtitlePreferenceTrack[], trackSrc: string): SubtitlePreferenceTrack | undefined {
  return tracks.find((t) => subtitleTrackSrcMatches(trackSrc, t.src));
}

/**
 * Turn on a saved external subtitle via movi-player's API (`selectSubtitleLang`).
 * `source({ subtitles })` ignores a `default` flag — lang select is the supported path.
 * Does not click the CC menu (that rebuilds the list and can stall playback).
 */
async function applyPreferredSubtitleTrack(
  player: MoviPlayerHandle,
  tracks: SubtitlePreferenceTrack[],
  trackSrc: string | null,
): Promise<boolean> {
  if (!trackSrc || tracks.length === 0 || typeof player.selectSubtitleLang !== "function") return false;
  installExternalSubtitleOffset(player);
  const track = findPreferenceTrack(tracks, trackSrc);
  if (!track) return false;
  try {
    return (await player.selectSubtitleLang(track.srclang)) === true;
  } catch {
    return false;
  }
}

/** Retry `selectSubtitleLang` until the inner player exists (once per mount). */
export function scheduleApplyPreferredSubtitleTrack(
  player: MoviPlayerHandle,
  tracks: SubtitlePreferenceTrack[],
  trackSrc: string | null,
): () => void {
  if (!trackSrc || tracks.length === 0) return () => {};

  const host = player as MoviPlayerSubtitleApplyHost;
  if (host.__seedarrPreferredSubtitleApplied) return () => {};

  let cancelled = false;
  let attempts = 0;
  const maxAttempts = 12;

  const tick = (): void => {
    if (cancelled || attempts >= maxAttempts || host.__seedarrPreferredSubtitleApplied) return;
    attempts += 1;
    void applyPreferredSubtitleTrack(player, tracks, trackSrc).then((ok) => {
      if (cancelled || host.__seedarrPreferredSubtitleApplied) return;
      if (ok) {
        host.__seedarrPreferredSubtitleApplied = true;
        host.__seedarrApplySubtitleCancel = undefined;
        return;
      }
      if (!cancelled && attempts < maxAttempts) window.setTimeout(tick, 200);
    });
  };

  host.__seedarrApplySubtitleCancel?.();
  host.__seedarrApplySubtitleCancel = () => {
    cancelled = true;
  };
  tick();
  return host.__seedarrApplySubtitleCancel;
}

type MoviPlayerSubtitleApplyHost = MoviPlayerHandle & {
  __seedarrApplySubtitleCancel?: () => void;
  __seedarrPreferredSubtitleApplied?: boolean;
};

export function cancelScheduledPreferredSubtitleApply(player: MoviPlayerHandle): void {
  const host = player as MoviPlayerSubtitleApplyHost;
  host.__seedarrApplySubtitleCancel?.();
  host.__seedarrApplySubtitleCancel = undefined;
}

export function isCcMenuOpen(player: MoviPlayerHandle): boolean {
  return Boolean(player.shadowRoot?.querySelector(".movi-subtitle-track-menu.is-open"));
}

/** Prevent seek bar buttons from receiving clicks under the open CC panel. */
function syncSeekControlsUnderCcMenu(player: MoviPlayerHandle): void {
  const root = player.shadowRoot;
  if (!root) return;
  const block = isCcMenuOpen(player);
  for (const selector of [".movi-seek-forward", ".movi-seek-backward"]) {
    const el = root.querySelector<HTMLElement>(selector);
    if (el) el.style.pointerEvents = block ? "none" : "";
  }
}

function observeCcMenuSeekBlock(player: MoviPlayerHandle): void {
  const root = player.shadowRoot;
  if (!root) return;
  const menu = root.querySelector<HTMLElement>(".movi-subtitle-track-menu");
  if (!menu || menu.dataset.seedarrSeekBlockObserver) return;
  menu.dataset.seedarrSeekBlockObserver = "true";
  const observer = new MutationObserver(() => syncSeekControlsUnderCcMenu(player));
  observer.observe(menu, { attributes: true, attributeFilter: ["class"] });
  syncSeekControlsUnderCcMenu(player);
}

type ExternalSubtitleCue = {
  start: number;
  end: number;
  __seedarrBaseStart?: number;
  __seedarrBaseEnd?: number;
};

type SubtitleEngine = {
  _externalSubCues?: ExternalSubtitleCue[];
  selectSubtitleLang?: (lang: string | null) => Promise<boolean> | boolean;
  __seedarrSelectWrapped?: boolean;
};

type SubtitleOffsetHost = MoviPlayerHandle & {
  player?: SubtitleEngine;
  __seedarrSubtitleOffset?: number;
};

/**
 * movi-player external subs (our VTT blobs) pick the active cue with a timer on the
 * original [start, end], then `subtitleDelay` shows it only where that window overlaps
 * `time - delay`. The overlap shrinks as |delay| grows, so cues get cut and then vanish.
 * Shift both timestamps by the same offset and keep the engine delay at 0 so duration stays intact.
 */
export function shiftSubtitleCueWindow(cues: ExternalSubtitleCue[], delaySeconds: number): void {
  for (const cue of cues) {
    if (cue.__seedarrBaseStart === undefined || cue.__seedarrBaseEnd === undefined) {
      cue.__seedarrBaseStart = cue.start;
      cue.__seedarrBaseEnd = cue.end;
    }
    cue.start = cue.__seedarrBaseStart + delaySeconds;
    cue.end = cue.__seedarrBaseEnd + delaySeconds;
  }
}

function readSubtitleOffset(player: MoviPlayerHandle): number {
  return (player as SubtitleOffsetHost).__seedarrSubtitleOffset ?? 0;
}

function applyExternalSubtitleOffset(player: MoviPlayerHandle, delaySeconds: number): void {
  const host = player as SubtitleOffsetHost;
  host.__seedarrSubtitleOffset = delaySeconds;
  if (player.subtitleDelay !== 0) player.subtitleDelay = 0;
  const cues = host.player?._externalSubCues;
  if (cues && cues.length > 0) shiftSubtitleCueWindow(cues, delaySeconds);
}

/** Re-apply the offset after movi reloads cues (track change replaces the array). */
function installExternalSubtitleOffset(player: MoviPlayerHandle): void {
  const engine = (player as SubtitleOffsetHost).player;
  if (!engine?.selectSubtitleLang || engine.__seedarrSelectWrapped) return;
  const original = engine.selectSubtitleLang.bind(engine);
  engine.selectSubtitleLang = async (lang) => {
    const ok = await original(lang);
    if (ok) applyExternalSubtitleOffset(player, readSubtitleOffset(player));
    return ok === true;
  };
  engine.__seedarrSelectWrapped = true;
}

function notifySubtitlePreferences(player: MoviPlayerHandle, opts: CcExtrasOpts): void {
  if (!opts.onSubtitlePreferencesChange) return;
  opts.onSubtitlePreferencesChange({
    subtitleDelay: readSubtitleOffset(player),
    subtitleTrackSrc: readActiveSubtitleTrackSrc(player, opts.tracks ?? []),
  });
}

/** Inject Add / Delay controls into movi-player's CC menu (native delay UI is file-source only). */
function injectCcExtras(player: MoviPlayerHandle, opts: CcExtrasOpts): void {
  const labels = { ...DEFAULT_CC_LABELS, ...opts.labels };
  const menu = player.shadowRoot?.querySelector(".movi-subtitle-track-menu");
  if (!menu || menu.querySelector("[data-seedarr-cc-extras]")) return;

  const wrap = document.createElement("div");
  wrap.dataset.seedarrCcExtras = "true";
  wrap.style.cssText =
    "border-top:1px solid rgba(255,255,255,0.12);padding:0.4rem 0.5rem;display:flex;flex-direction:column;gap:0.35rem;";
  wrap.addEventListener(
    "pointerdown",
    (event) => {
      event.stopPropagation();
    },
    true,
  );

  const tv = opts.tv === true;
  const tvBtnStyle = tv
    ? "border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:inherit;border-radius:0.4rem;padding:0.45rem 0.35rem;font:inherit;font-size:0.82rem;cursor:pointer;min-width:0;width:100%;"
    : "border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:inherit;border-radius:0.35rem;padding:0.15rem 0.4rem;font:inherit;font-size:0.7rem;cursor:pointer;";

  if (opts.onAddSubtitles) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = labels.addSubtitles;
    btn.className = tv ? "seedarr-tv-cc-menu-btn" : "";
    btn.style.cssText = tv
      ? "display:flex;width:100%;align-items:center;justify-content:center;padding:0.65rem 0.75rem;border:0;border-radius:0.4rem;background:rgba(255,255,255,0.1);color:inherit;font:inherit;font-size:0.9rem;cursor:pointer;"
      : "display:flex;width:100%;align-items:center;justify-content:center;padding:0.45rem 0.5rem;border:0;border-radius:0.35rem;background:rgba(255,255,255,0.08);color:inherit;font:inherit;font-size:0.8rem;cursor:pointer;";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onAddSubtitles?.();
    });
    wrap.appendChild(btn);
  }

  if (opts.enableDelay) {
    const row = document.createElement("div");
    row.dataset.seedarrDelayRow = "true";
    row.style.cssText = tv
      ? "display:flex;flex-direction:column;align-items:stretch;gap:0.45rem;padding:0.25rem 0 0.1rem;"
      : "display:flex;align-items:center;justify-content:space-between;gap:0.35rem;";

    const label = document.createElement("span");
    label.textContent = labels.delay;
    label.style.cssText = tv ? "font-size:0.9rem;font-weight:600;opacity:0.95;" : "font-size:0.75rem;opacity:0.8;";

    const controls = document.createElement("div");
    controls.dataset.seedarrDelayControls = "true";
    controls.style.cssText = tv
      ? "display:grid;grid-template-columns:repeat(6,minmax(0,1fr));align-items:center;gap:0.35rem;width:100%;"
      : "display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap;justify-content:flex-end;";

    const readout = document.createElement("span");
    readout.style.cssText = tv
      ? "min-width:0;text-align:center;font-variant-numeric:tabular-nums;font-size:0.9rem;font-weight:600;padding:0.35rem 0;"
      : "min-width:3.25rem;text-align:center;font-variant-numeric:tabular-nums;font-size:0.75rem;";
    const formatDelay = (seconds: number): string =>
      seconds === 0 ? "0s" : `${seconds > 0 ? "+" : ""}${seconds.toFixed(1)}s`;

    const applyDelay = (next: number): void => {
      installExternalSubtitleOffset(player);
      applyExternalSubtitleOffset(player, next);
      readout.textContent = formatDelay(next);
      notifySubtitlePreferences(player, opts);
    };

    readout.textContent = formatDelay(readSubtitleOffset(player));

    const makeBtn = (text: string, delta: number | "zero"): HTMLButtonElement => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = text;
      btn.className = tv ? "seedarr-tv-cc-menu-btn" : "";
      btn.dataset.seedarrCcFocus = "true";
      btn.style.cssText = tvBtnStyle;
      const step = (): void => {
        const current = readSubtitleOffset(player);
        const next = delta === "zero" ? 0 : Math.round((current + delta) * 10) / 10;
        applyDelay(next);
      };
      let skipClickAfterPointer = false;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (skipClickAfterPointer) {
          skipClickAfterPointer = false;
          return;
        }
        step();
      });
      attachHoldRepeat(btn, step, () => {
        skipClickAfterPointer = true;
      });
      return btn;
    };

    controls.append(
      makeBtn("−1", -1),
      makeBtn("−0.1", -0.1),
      readout,
      makeBtn("+0.1", 0.1),
      makeBtn("+1", 1),
      makeBtn(labels.delayReset ?? "0", "zero"),
    );
    row.append(label, controls);
    wrap.appendChild(row);
  }

  menu.appendChild(wrap);
}

/**
 * movi-player hides `.movi-subtitle-track-container` when there are no tracks.
 * Keep the CC button visible so users can still open the menu and add subtitles.
 */
export function ensureCcMenuAvailable(player: MoviPlayerHandle, opts: CcExtrasOpts): void {
  const labels = { ...DEFAULT_CC_LABELS, ...opts.labels };
  if (opts.initialSubtitleDelay !== undefined) {
    applyExternalSubtitleOffset(player, opts.initialSubtitleDelay);
  }
  installExternalSubtitleOffset(player);

  const showCcControls = (): void => {
    const root = player.shadowRoot;
    if (!root) return;

    const container = root.querySelector<HTMLElement>(".movi-subtitle-track-container");
    const btn = root.querySelector<HTMLElement>(".movi-subtitle-track-btn");
    const list = root.querySelector<HTMLElement>(".movi-subtitle-track-list");
    const footer = root.querySelector<HTMLElement>(".movi-subtitle-track-footer");

    if (container) container.style.display = "flex";
    if (btn) btn.style.display = "flex";

    // When no tracks exist, updateSubtitleTrackMenu returns early without seeding the list.
    if (list && list.childElementCount === 0) {
      const offItem = document.createElement("div");
      offItem.className = "movi-subtitle-track-item movi-subtitle-track-active";
      offItem.dataset.trackId = "null";
      const offLabel = document.createElement("span");
      offLabel.className = "movi-subtitle-track-label";
      offLabel.textContent = labels.off;
      offItem.appendChild(offLabel);
      list.replaceChildren(offItem);
      if (footer) footer.textContent = labels.noTracks;
    }

    injectCcExtras(player, opts);
    observeCcMenuSeekBlock(player);
    installExternalSubtitleOffset(player);

    const menuRoot = root.querySelector<HTMLElement>(".movi-subtitle-track-menu");
    if (list && menuRoot && !menuRoot.dataset.seedarrTrackPrefsListener) {
      menuRoot.dataset.seedarrTrackPrefsListener = "true";
      const scheduleNotify = (): void => {
        window.setTimeout(() => notifySubtitlePreferences(player, opts), 0);
      };
      list.addEventListener(
        "click",
        (event) => {
          if (!(event.target instanceof HTMLElement)) return;
          if (!event.target.closest(".movi-subtitle-track-item")) return;
          scheduleNotify();
        },
        true,
      );
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "attributes" || mutation.attributeName !== "class") continue;
          const target = mutation.target;
          if (!(target instanceof HTMLElement) || !target.classList.contains("movi-subtitle-track-item")) continue;
          if (!target.classList.contains("movi-subtitle-track-active")) continue;
          scheduleNotify();
          break;
        }
      });
      observer.observe(list, { attributes: true, subtree: true, attributeFilter: ["class"] });
    }
  };

  const el = player as MoviPlayerHandle & {
    updateSubtitleTrackMenu?: () => void;
    __seedarrCcPatched?: boolean;
  };

  if (typeof el.updateSubtitleTrackMenu === "function" && !el.__seedarrCcPatched) {
    const original = el.updateSubtitleTrackMenu.bind(el);
    el.updateSubtitleTrackMenu = () => {
      original();
      showCcControls();
    };
    el.__seedarrCcPatched = true;
  }

  showCcControls();
}
