import { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";

import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { isSearchPath, type SearchRouteType, validateSearchRouteSearch } from "@/routes/helpers/search-route.helper";

function defaultTypeFromPath(pathname: string): SearchRouteType {
  return pathname.startsWith("/tv") ? "tv" : "movie";
}

/** Debounced `q` → `/search` search params. Source of truth is the URL on `/search`. */
export function useTopbarSearchRoute(preferredType?: SearchRouteType) {
  const location = useLocation();
  const navigate = useNavigate();
  const tvMode = useTvMode();
  const onSearchRoute = isSearchPath(location.pathname);
  const routeSearch = onSearchRoute ? validateSearchRouteSearch(location.search as Record<string, unknown>) : null;
  const urlQ = routeSearch?.q ?? "";
  const fallbackType = preferredType ?? defaultTypeFromPath(location.pathname);

  const [query, setQuery] = useState(urlQ);
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);
  /** Skip one off-route `/search` push after leaving the page (back button; stale query before setState). */
  const suppressOffRouteSearchNavRef = useRef(false);

  useEffect(() => {
    if (onSearchRoute) {
      suppressOffRouteSearchNavRef.current = false;
      setQuery(urlQ);
    } else {
      suppressOffRouteSearchNavRef.current = true;
      setQuery("");
    }
  }, [urlQ, onSearchRoute]);

  useEffect(() => {
    if (onSearchRoute) {
      if (debouncedQuery === urlQ) return;

      navigate({
        to: "/search",
        search: (prev) => ({
          ...validateSearchRouteSearch(prev as Record<string, unknown>),
          q: debouncedQuery,
          ...(tvMode ? { mode: "tv" as const } : {}),
        }),
        replace: true,
        resetScroll: false,
      });
      return;
    }

    if (suppressOffRouteSearchNavRef.current) {
      suppressOffRouteSearchNavRef.current = false;
      return;
    }

    if (query.trim().length === 0) return;
    if (debouncedQuery !== query) return;
    if (debouncedQuery.trim().length === 0) return;

    navigate({
      to: "/search",
      search: { q: debouncedQuery, type: fallbackType, ...(tvMode ? { mode: "tv" as const } : {}) },
      resetScroll: false,
    });
  }, [debouncedQuery, fallbackType, navigate, onSearchRoute, query, tvMode, urlQ]);

  return { query, setQuery };
}
