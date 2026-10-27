import { useCallback, useMemo } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/features/auth/auth-store";
import { isOwnProfileTopbarPath, validateProfileSearch } from "@/routes/helpers/profile-route.helper";
import { useTopbarDebouncedQuery } from "./use-topbar-debounced-query";

/** Debounced `q` on own profile routes. */
export function useTopbarProfileSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useAuth((s) => s.user?.id);
  const onProfile = Boolean(userId && isOwnProfileTopbarPath(location.pathname, userId));
  const routeSearch = useMemo(
    () => validateProfileSearch(location.search as Record<string, unknown>),
    [location.search],
  );
  const urlQ = routeSearch.q ?? "";

  const commit = useCallback(
    (debounced: string) => {
      const next = debounced.trim() || undefined;
      if ((urlQ ?? undefined) === next) return;
      navigate({
        to: location.pathname,
        search: { ...routeSearch, q: next },
        resetScroll: false,
      });
    },
    [location.pathname, navigate, routeSearch, urlQ],
  );

  const { query, setQuery } = useTopbarDebouncedQuery(urlQ, onProfile, commit);

  return { query, setQuery, onProfile };
}
