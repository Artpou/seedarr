import { useCallback, useMemo } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";

import { useTopbarDebouncedQuery } from "./use-topbar-debounced-query";

export type SettingsTopbarSearchKind = "modules" | "activity" | "users";

function settingsSearchTarget(pathname: string): { kind: SettingsTopbarSearchKind; to: string } | null {
  if (pathname === "/settings/modules" || pathname === "/settings/modules/") {
    return { kind: "modules", to: "/settings/modules" };
  }
  if (pathname === "/settings/activity" || pathname === "/settings/activity/") {
    return { kind: "activity", to: "/settings/activity" };
  }
  if (pathname === "/settings/users" || pathname === "/settings/users/") {
    return { kind: "users", to: "/settings/users" };
  }
  return null;
}

/** Debounced `q` on settings list routes that support search. */
export function useTopbarSettingsSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const target = settingsSearchTarget(location.pathname);
  const urlQ = useMemo(() => {
    const q = (location.search as Record<string, unknown>).q;
    return typeof q === "string" ? q : "";
  }, [location.search]);

  const commit = useCallback(
    (debounced: string) => {
      if (!target) return;
      const next = debounced.trim() || undefined;
      if ((urlQ ?? undefined) === (next ?? "")) return;
      navigate({
        to: target.to,
        search: (prev) => {
          const record = { ...(prev as Record<string, unknown>) };
          if (next) record.q = next;
          else delete record.q;
          return record;
        },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate, target, urlQ],
  );

  const { query, setQuery } = useTopbarDebouncedQuery(urlQ, Boolean(target), commit);

  return { query, setQuery, target };
}
