import { setFocus } from "@noriginmedia/norigin-spatial-navigation";

import type { TvFocusTarget } from "@/shared/ui/tv/tv-focusable";

import { useTvSidebarStore } from "@/features/tv-mode/tv-sidebar-store";

/** Force vertical moves inside the TV sidebar (avoids jumping to main content). */
export function tvSidebarVerticalArrow(
  upFocusKey?: string,
  downFocusKey?: string,
): Pick<TvFocusTarget, "onArrowPress"> {
  return {
    onArrowPress: (direction) => {
      if (direction === "up" && upFocusKey) {
        setFocus(upFocusKey);
        return false;
      }
      if (direction === "down" && downFocusKey) {
        setFocus(downFocusKey);
        return false;
      }
      if (direction === "left") {
        return false;
      }
      if (direction === "right") {
        const lastContentFocusKey = useTvSidebarStore.getState().lastContentFocusKey;
        if (lastContentFocusKey) {
          useTvSidebarStore.getState().markPendingContentFocusRestore();
          setFocus(lastContentFocusKey);
          return false;
        }
        return true;
      }
      return true;
    },
  };
}
