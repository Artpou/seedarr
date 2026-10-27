import { useEffect } from "react";

import { pause, resume } from "@noriginmedia/norigin-spatial-navigation";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

/** While watching: spatial nav off so ←/→/OK control the player, not the page. */
export function useTvPlaybackChrome(active: boolean): void {
  const tvMode = useTvMode();

  useEffect(() => {
    if (!tvMode || !active) return;
    pause();
    return () => {
      resume();
    };
  }, [tvMode, active]);
}
