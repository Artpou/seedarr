import type { ReactNode } from "react";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

/** Hides children when spatial TV mode is active (`?mode=tv`). */
export function TvModeHide({ children }: { children: ReactNode }) {
  const tvMode = useTvMode();
  if (tvMode) return null;
  return children;
}
