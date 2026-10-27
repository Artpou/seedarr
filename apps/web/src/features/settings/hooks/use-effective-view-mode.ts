import { useIsMobile } from "@/shared/hooks/use-mobile";

import {
  useUserPreferences,
  type ViewMode,
  type ViewModeScope,
} from "@/features/settings/stores/user-preference-store";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

/** List layout is desktop-only — always force grid on mobile and in TV mode. */
export function useEffectiveViewMode(scope: ViewModeScope): ViewMode {
  const isMobile = useIsMobile();
  const tvMode = useTvMode();
  const viewMode = useUserPreferences((s) => s.viewModes[scope]);
  if (isMobile || tvMode) return "grid";
  return viewMode;
}
