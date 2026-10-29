import { useEffect } from "react";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

const stack: Array<() => void> = [];

export function pushTvBackIntercept(onBack: () => void): () => void {
  stack.push(onBack);
  return () => {
    const index = stack.lastIndexOf(onBack);
    if (index >= 0) stack.splice(index, 1);
  };
}

/** Runs the topmost overlay back handler (e.g. close dialog). */
export function interceptTvBack(): boolean {
  const handler = stack.at(-1);
  if (!handler) return false;
  handler();
  return true;
}

/** While `active`, TV Back closes the overlay instead of navigating away. */
export function useTvBackIntercept(active: boolean, onBack: () => void): void {
  const tvMode = useTvMode();

  useEffect(() => {
    if (!tvMode || !active) return;
    return pushTvBackIntercept(onBack);
  }, [tvMode, active, onBack]);
}
