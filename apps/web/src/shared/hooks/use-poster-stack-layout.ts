import { useIsMobile } from "@/shared/hooks/use-mobile";

/** Mobile only: full-width backdrop / trailer hero + stacked actions (not used in `?mode=tv`). */
export function usePosterStackLayout(): boolean {
  return useIsMobile();
}
