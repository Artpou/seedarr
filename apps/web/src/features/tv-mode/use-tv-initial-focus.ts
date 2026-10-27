import { useEffect } from "react";

import { setFocus } from "@noriginmedia/norigin-spatial-navigation";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

/** Moves spatial focus when the default target changes (TV remote). */
export function useTvInitialFocus(focusKey: string | undefined) {
  const tvMode = useTvMode();

  useEffect(() => {
    if (!tvMode || !focusKey) return;
    const frame = requestAnimationFrame(() => {
      setFocus(focusKey);
    });
    return () => cancelAnimationFrame(frame);
  }, [tvMode, focusKey]);
}
