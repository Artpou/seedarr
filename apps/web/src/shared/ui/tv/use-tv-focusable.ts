import { useEffect } from "react";

import { type UseFocusableConfig, useFocusable } from "@noriginmedia/norigin-spatial-navigation";

import { cn } from "@/lib/utils";

import { scrollTvFocusIfNeeded } from "@/features/tv-mode/tv-focus-scroll.helper";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { isTvSidebarNavFocusKey, useTvSidebarStore } from "@/features/tv-mode/tv-sidebar-store";

/** Focus visuals live in `styles.css` under `html[data-tv]` (inset highlight, follows border-radius). */
const tvFocusTargetClass = cn("outline-none transition-[box-shadow,background-color,border-color,color] duration-150");

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
    if (typeof focusKey === "string") {
      if (isTvSidebarNavFocusKey(focusKey)) {
        useTvSidebarStore.getState().setExpanded(true);
        return;
      }
      useTvSidebarStore.getState().setExpanded(false);
      useTvSidebarStore.getState().setLastContentFocusKey(focusKey);
    }

    const skipScroll = useTvSidebarStore.getState().consumePendingContentFocusRestore();
    if (skipScroll) {
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
