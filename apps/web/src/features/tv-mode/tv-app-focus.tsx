import type { ReactNode } from "react";

import { FocusContext, useFocusable } from "@noriginmedia/norigin-spatial-navigation";

import { cn } from "@/lib/utils";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

type TvAppFocusProps = {
  children: ReactNode;
  className?: string;
};

/** Root focus boundary for spatial navigation when TV mode is on. */
export function TvAppFocus({ children, className }: TvAppFocusProps) {
  const tvMode = useTvMode();
  const { ref, focusKey } = useFocusable({
    focusKey: "SEEDARR_APP",
    focusable: tvMode,
    trackChildren: true,
  });

  if (!tvMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className={cn(className, "outline-none")}>
        {children}
      </div>
    </FocusContext.Provider>
  );
}
