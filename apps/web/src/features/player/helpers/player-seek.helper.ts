import type { MoviPlayerHandle } from "@/features/player/helpers/movi-player.helper";
import { isCcMenuOpen } from "@/features/player/helpers/movi-player.helper";

export const PLAYER_SEEK_SECONDS = 10;

const STYLE_ID = "seedarr-seek-feedback-style";
const LAYER_CLASS = "seedarr-seek-feedback-layer";
const HIDE_MS = 720;
const STACK_WINDOW_MS = 900;
const DOUBLE_TAP_MS = 320;
const EDGE_RATIO = 0.38;

let globalHideTimer: number | undefined;

type SeekStack = {
  direction: "backward" | "forward" | null;
  totalSeconds: number;
  lastAt: number;
};

let seekStack: SeekStack = { direction: null, totalSeconds: 0, lastAt: 0 };

export function accumulateSeekStack(
  prev: SeekStack,
  deltaSeconds: number,
  now: number,
  windowMs: number = STACK_WINDOW_MS,
): SeekStack {
  const direction: "backward" | "forward" = deltaSeconds < 0 ? "backward" : "forward";
  const step = Math.abs(deltaSeconds);
  if (prev.direction === direction && now - prev.lastAt <= windowMs) {
    return { direction, totalSeconds: prev.totalSeconds + step, lastAt: now };
  }
  return { direction, totalSeconds: step, lastAt: now };
}

function resetSeekStack(): void {
  seekStack = { direction: null, totalSeconds: 0, lastAt: 0 };
}

function seekSecondsLabel(seconds: number): string {
  return `${seconds} s`;
}

function injectSeekFeedbackStyles(root: ShadowRoot, accent: string): void {
  if (root.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :host {
      position: relative;
    }
    .${LAYER_CLASS} {
      position: absolute;
      inset: 0;
      z-index: 6;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(4rem, 18vw, 9rem);
    }
    .seedarr-seek-feedback {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      opacity: 0;
      transform: scale(0.88);
      filter: blur(2px);
      transition: opacity 0.12s ease-out, transform 0.18s ease-out, filter 0.18s ease-out;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 2px 16px rgba(0, 0, 0, 0.85);
    }
    .seedarr-seek-feedback.is-active {
      opacity: 1;
      transform: scale(1);
      filter: blur(0);
    }
    .seedarr-seek-feedback__arrows {
      display: flex;
      align-items: center;
      gap: 0.12rem;
    }
    .seedarr-seek-feedback--backward .seedarr-seek-feedback__arrows {
      flex-direction: row-reverse;
    }
    .seedarr-seek-feedback__arrow {
      width: 0.55rem;
      height: 0.85rem;
      opacity: 0.35;
      background: linear-gradient(
        to var(--seedarr-seek-dir, right),
        transparent 35%,
        ${accent} 35%,
        ${accent} 65%,
        transparent 65%
      );
      clip-path: polygon(100% 50%, 0 0, 0 100%);
      transform: translateX(0);
    }
    .seedarr-seek-feedback--backward .seedarr-seek-feedback__arrow {
      --seedarr-seek-dir: left;
      clip-path: polygon(0 50%, 100% 0, 100% 100%);
    }
    .seedarr-seek-feedback.is-active .seedarr-seek-feedback__arrow {
      animation: seedarr-seek-pulse 0.55s ease-out forwards;
    }
    .seedarr-seek-feedback.is-active .seedarr-seek-feedback__arrow:nth-child(1) {
      animation-delay: 0ms;
    }
    .seedarr-seek-feedback.is-active .seedarr-seek-feedback__arrow:nth-child(2) {
      animation-delay: 70ms;
    }
    .seedarr-seek-feedback.is-active .seedarr-seek-feedback__arrow:nth-child(3) {
      animation-delay: 140ms;
    }
    @keyframes seedarr-seek-pulse {
      0% {
        opacity: 0.2;
        transform: translateX(0) scale(0.85);
      }
      35% {
        opacity: 1;
      }
      100% {
        opacity: 0.15;
        transform: translateX(var(--seedarr-seek-shift, 10px)) scale(1.05);
      }
    }
    .seedarr-seek-feedback--backward.is-active .seedarr-seek-feedback__arrow {
      --seedarr-seek-shift: -10px;
    }
    .seedarr-seek-feedback__label {
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid color-mix(in srgb, ${accent} 55%, transparent);
      box-shadow: 0 0 20px color-mix(in srgb, ${accent} 35%, transparent);
    }
  `;
  root.appendChild(style);
}

function buildFeedbackSide(direction: "backward" | "forward"): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = `seedarr-seek-feedback seedarr-seek-feedback--${direction}`;
  wrap.setAttribute("aria-hidden", "true");

  const arrows = document.createElement("div");
  arrows.className = "seedarr-seek-feedback__arrows";
  for (let i = 0; i < 3; i++) {
    const chevron = document.createElement("span");
    chevron.className = "seedarr-seek-feedback__arrow";
    arrows.appendChild(chevron);
  }

  const label = document.createElement("span");
  label.className = "seedarr-seek-feedback__label";

  wrap.append(arrows, label);
  return wrap;
}

/** Injects seek hint overlay into movi-player shadow DOM (idempotent). */
function ensurePlayerSeekFeedback(player: MoviPlayerHandle): void {
  const root = player.shadowRoot;
  if (!root || root.querySelector(`.${LAYER_CLASS}`)) return;

  const accent =
    player.getAttribute("themecolor")?.trim() ||
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
    "oklch(0.63 0.13 135)";

  injectSeekFeedbackStyles(root, accent);

  const layer = document.createElement("div");
  layer.className = LAYER_CLASS;
  layer.append(buildFeedbackSide("backward"), buildFeedbackSide("forward"));
  root.appendChild(layer);
}

function showPlayerSeekFeedback(
  player: MoviPlayerHandle,
  direction: "backward" | "forward",
  seconds: number = PLAYER_SEEK_SECONDS,
  options?: { stack?: boolean },
): void {
  ensurePlayerSeekFeedback(player);
  const root = player.shadowRoot;
  if (!root) return;

  const now = performance.now();
  let displaySeconds = seconds;
  if (options?.stack !== false) {
    const signedDelta = direction === "backward" ? -seconds : seconds;
    seekStack = accumulateSeekStack(seekStack, signedDelta, now);
    displaySeconds = seekStack.totalSeconds;
  }

  const backward = root.querySelector<HTMLElement>(".seedarr-seek-feedback--backward");
  const forward = root.querySelector<HTMLElement>(".seedarr-seek-feedback--forward");
  const active = direction === "backward" ? backward : forward;
  const inactive = direction === "backward" ? forward : backward;

  const prefix = direction === "backward" ? "−" : "+";
  const labelEl = active?.querySelector<HTMLElement>(".seedarr-seek-feedback__label");
  if (labelEl) labelEl.textContent = `${prefix}${seekSecondsLabel(displaySeconds)}`;

  inactive?.classList.remove("is-active");
  if (!active) return;

  active.classList.remove("is-active");
  void active.offsetWidth;
  active.classList.add("is-active");

  if (globalHideTimer !== undefined) window.clearTimeout(globalHideTimer);
  globalHideTimer = window.setTimeout(() => {
    backward?.classList.remove("is-active");
    forward?.classList.remove("is-active");
    resetSeekStack();
  }, HIDE_MS);
}

export function seekMoviPlayer(player: MoviPlayerHandle, deltaSeconds: number): void {
  const duration = Number.isFinite(player.duration) ? player.duration : Number.POSITIVE_INFINITY;
  const next = Math.max(0, Math.min(duration, player.currentTime + deltaSeconds));
  player.currentTime = next;
  showPlayerSeekFeedback(player, deltaSeconds < 0 ? "backward" : "forward", Math.abs(deltaSeconds));
}

function wireNativeSeekButtons(player: MoviPlayerHandle): () => void {
  const root = player.shadowRoot;
  if (!root) return () => {};

  const onBack = (): void => showPlayerSeekFeedback(player, "backward", PLAYER_SEEK_SECONDS);
  const onForward = (): void => showPlayerSeekFeedback(player, "forward", PLAYER_SEEK_SECONDS);

  const back = root.querySelector(".movi-seek-backward");
  const forward = root.querySelector(".movi-seek-forward");
  back?.addEventListener("click", onBack);
  forward?.addEventListener("click", onForward);

  return () => {
    back?.removeEventListener("click", onBack);
    forward?.removeEventListener("click", onForward);
  };
}

/** Double-tap / double-click on left/right edges (YouTube-style). */
function attachPlayerEdgeDoubleTapSeek(player: MoviPlayerHandle, isCancelled: () => boolean): () => void {
  let lastTap = { at: 0, x: 0, y: 0 };

  const onPointerUp = (event: PointerEvent): void => {
    if (isCancelled()) return;
    if (isCcMenuOpen(player)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = player.getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = (event.clientX - rect.left) / rect.width;
    const now = performance.now();
    const isDouble =
      now - lastTap.at <= DOUBLE_TAP_MS &&
      Math.abs(event.clientX - lastTap.x) < 48 &&
      Math.abs(event.clientY - lastTap.y) < 48;

    lastTap = { at: now, x: event.clientX, y: event.clientY };
    if (!isDouble) return;

    if (ratio < EDGE_RATIO) {
      event.preventDefault();
      event.stopPropagation();
      seekMoviPlayer(player, -PLAYER_SEEK_SECONDS);
      return;
    }

    if (ratio > 1 - EDGE_RATIO) {
      event.preventDefault();
      event.stopPropagation();
      seekMoviPlayer(player, PLAYER_SEEK_SECONDS);
    }
  };

  player.addEventListener("pointerup", onPointerUp, { capture: true });
  player.style.touchAction = "manipulation";

  return () => {
    player.removeEventListener("pointerup", onPointerUp, { capture: true });
  };
}

/** Seek overlay + edge double-tap + native bar seek hints. */
export function setupPlayerSeekUx(player: MoviPlayerHandle, isCancelled: () => boolean): () => void {
  ensurePlayerSeekFeedback(player);
  const detachTap = attachPlayerEdgeDoubleTapSeek(player, isCancelled);
  const detachNative = wireNativeSeekButtons(player);
  return () => {
    detachTap();
    detachNative();
  };
}
