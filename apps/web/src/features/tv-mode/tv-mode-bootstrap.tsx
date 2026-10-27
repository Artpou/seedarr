import { useEffect, useRef } from "react";

import { init } from "@noriginmedia/norigin-spatial-navigation";
import { useLocation } from "@tanstack/react-router";

import { useTvModeStore } from "@/features/tv-mode/tv-mode-store";

/** Syncs `?mode=tv` → store, spatial-nav init, and `data-tv` on `<html>`. */
export function TvModeBootstrap() {
  const location = useLocation();
  const enabled = useTvModeStore((s) => s.enabled);
  const setEnabled = useTvModeStore((s) => s.setEnabled);
  const spatialReady = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: react to router navigations via href
  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    if (mode === "tv") setEnabled(true);
  }, [location.href, setEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.setAttribute("data-tv", "true");
    else root.removeAttribute("data-tv");
  }, [enabled]);

  useEffect(() => {
    if (!enabled || spatialReady.current) return;
    init({ debug: false, visualDebug: false });
    spatialReady.current = true;
  }, [enabled]);

  return null;
}
