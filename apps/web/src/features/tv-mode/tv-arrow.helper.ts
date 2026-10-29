import { setFocus } from "@noriginmedia/norigin-spatial-navigation";

import type { TvFocusTarget } from "@/shared/ui/tv/tv-focusable";

/** ArrowUp jumps back to a parent focus target (e.g. detail tab). */
export function tvArrowUpHandler(upFocusKey: string | undefined): Pick<TvFocusTarget, "onArrowPress"> {
  if (!upFocusKey) return {};
  return {
    onArrowPress: (direction) => {
      if (direction === "up") {
        setFocus(upFocusKey);
        return false;
      }
      return true;
    },
  };
}
