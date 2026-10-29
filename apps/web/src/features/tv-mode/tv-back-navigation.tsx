import { useEffect, useState } from "react";

import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useLocation, useRouter } from "@tanstack/react-router";

import {
  isTvBackKey,
  isTvFocusInTopbar,
  isTvTopbarBackRoot,
  resolveTvTopbarBackFocusKey,
} from "@/features/tv-mode/tv-back.helper";
import { interceptTvBack } from "@/features/tv-mode/tv-back-intercept";
import { TvExitDialog } from "@/features/tv-mode/tv-exit-dialog";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

/** Global TV remote Back: history back, or topbar → exit on main tab roots. */
export function TvBackNavigation() {
  const tvMode = useTvMode();
  const router = useRouter();
  const { pathname } = useLocation();
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    if (!tvMode) return;
    if (pathname.includes("/play")) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTvBackKey(event.key)) return;
      event.preventDefault();
      event.stopPropagation();

      if (exitOpen) {
        setExitOpen(false);
        return;
      }

      if (interceptTvBack()) {
        return;
      }

      if (isTvTopbarBackRoot(pathname)) {
        if (isTvFocusInTopbar()) {
          setExitOpen(true);
        } else {
          const focusKey = resolveTvTopbarBackFocusKey(pathname);
          if (focusKey) setFocus(focusKey);
        }
        return;
      }

      router.history.back();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [exitOpen, pathname, router.history, tvMode]);

  if (!tvMode) return null;

  return <TvExitDialog open={exitOpen} onOpenChange={setExitOpen} />;
}
