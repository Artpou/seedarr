import { setFocus } from "@noriginmedia/norigin-spatial-navigation";

import type { TvFocusTarget } from "@/shared/ui/tv/tv-focusable";

import { scrollTvFocusIfNeeded } from "@/features/tv-mode/tv-focus-scroll.helper";

function scrollAfterTvFocus(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const focused = document.querySelector('[data-tv-focused="true"]');
      if (focused instanceof HTMLElement) {
        scrollTvFocusIfNeeded(focused);
      }
    });
  });
}

/** ArrowUp jumps back to a parent focus target (e.g. detail tab). */
export function tvArrowUpHandler(upFocusKey: string | undefined): Pick<TvFocusTarget, "onArrowPress"> {
  if (!upFocusKey) return {};
  return {
    onArrowPress: (direction) => {
      if (direction === "up") {
        setFocus(upFocusKey);
        scrollAfterTvFocus();
        return false;
      }
      return true;
    },
  };
}
