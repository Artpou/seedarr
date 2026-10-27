import { useEffect } from "react";

import { type UseFocusableConfig, useFocusable } from "@noriginmedia/norigin-spatial-navigation";

import { cn } from "@/lib/utils";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

/** Focus visuals live in `styles.css` under `html[data-tv]` (inset highlight, follows border-radius). */
const tvFocusTargetClass = cn("outline-none transition-[box-shadow,background-color,border-color,color] duration-150");

const VIEW_BOTTOM_PADDING = 24;

function tvTopbarScrollInset(): number {
  const header = document.querySelector('[data-slot="app-topbar"]');
  if (header instanceof HTMLElement) {
    return header.getBoundingClientRect().height + 12;
  }
  return 72;
}

/** Scroll only when the focus target leaves the safe band; align under the topbar, not at the bottom. */
function scrollTvFocusIfNeeded(el: HTMLElement): void {
  const topInset = tvTopbarScrollInset();
  const rect = el.getBoundingClientRect();
  const safeBottom = window.innerHeight - VIEW_BOTTOM_PADDING;

  if (rect.top >= topInset && rect.bottom <= safeBottom) {
    return;
  }

  el.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
}

type TvFocusableConfig<P = unknown> = UseFocusableConfig<P> & {
  onFocused?: () => void;
};

export function useTvFocusable<P = unknown>(config: TvFocusableConfig<P>) {
  const { onFocused, ...focusableConfig } = config;
  const tvMode = useTvMode();
  const result = useFocusable({
    ...focusableConfig,
    focusable: tvMode && (focusableConfig.focusable ?? true),
  });

  useEffect(() => {
    if (!tvMode || !result.focused) return;
    onFocused?.();

    const focusKey = focusableConfig.focusKey;
    if (typeof focusKey === "string" && focusKey.startsWith("NAV-")) {
      return;
    }

    const el = result.ref.current;
    if (!(el instanceof HTMLElement)) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollTvFocusIfNeeded(el));
    });
    return () => cancelAnimationFrame(id);
  }, [tvMode, result.focused, result.ref, onFocused, focusableConfig.focusKey]);

  return {
    ...result,
    tvMode,
    tvClassName: tvFocusTargetClass,
  };
}
