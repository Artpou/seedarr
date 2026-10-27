import { useCallback, useMemo } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";

import { validateDownloadsSearch } from "@/routes/helpers/downloads-route.helper";
import { useTopbarDebouncedQuery } from "./use-topbar-debounced-query";

function isDownloadsPath(pathname: string): boolean {
  return pathname === "/downloads" || pathname === "/downloads/";
}

/** Debounced `q` → `/downloads` search params (topbar library search). */
export function useTopbarDownloadsSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const onDownloads = isDownloadsPath(location.pathname);
  const routeSearch = useMemo(
    () => validateDownloadsSearch(location.search as Record<string, unknown>),
    [location.search],
  );
  const urlQ = routeSearch.q ?? "";

  const commit = useCallback(
    (debounced: string) => {
      const next = debounced.trim() || undefined;
      if ((urlQ ?? undefined) === next) return;
      navigate({
        to: "/downloads",
        search: { ...routeSearch, q: next },
        resetScroll: false,
      });
    },
    [navigate, routeSearch, urlQ],
  );

  const { query, setQuery } = useTopbarDebouncedQuery(urlQ, onDownloads, commit);

  return { query, setQuery, onDownloads };
}
