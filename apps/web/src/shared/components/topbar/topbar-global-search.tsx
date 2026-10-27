import { useCallback, useEffect, useId, useRef } from "react";

import { useLingui } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Input } from "@/shared/ui/input";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { isSearchPath, type SearchRouteType } from "@/routes/helpers/search-route.helper";
import { useTopbarSearchRoute } from "./use-topbar-search-route";

type TopbarGlobalSearchProps = {
  defaultType?: SearchRouteType;
  classNameWrapper?: string;
  autoFocus?: boolean;
};

export function TopbarGlobalSearch({ defaultType, classNameWrapper, autoFocus }: TopbarGlobalSearchProps) {
  const { t } = useLingui();
  const tvMode = useTvMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { query, setQuery } = useTopbarSearchRoute(defaultType);
  const onSearchRoute = isSearchPath(location.pathname);
  const pendingTvInputFocus = useRef(false);
  const inputId = useId();

  const wrapperClass = classNameWrapper ?? "min-w-0 flex-1";

  const resolveType = (): SearchRouteType => defaultType ?? (location.pathname.startsWith("/tv") ? "tv" : "movie");

  const openSearchPage = () => {
    pendingTvInputFocus.current = true;
    void navigate({
      to: "/search",
      search: {
        q: query,
        type: resolveType(),
        mode: "tv",
      } as { q: string; type: SearchRouteType; mode: string },
      resetScroll: false,
    });
  };

  const focusSearchInput = useCallback(() => {
    document.getElementById(inputId)?.focus();
  }, [inputId]);

  useEffect(() => {
    if (!tvMode || !onSearchRoute || !pendingTvInputFocus.current) return;
    pendingTvInputFocus.current = false;
    const frame = requestAnimationFrame(() => focusSearchInput());
    return () => cancelAnimationFrame(frame);
  }, [tvMode, onSearchRoute, focusSearchInput]);

  const tvTopbarLauncher = tvMode && !onSearchRoute;

  const field = (
    <Input
      id={inputId}
      type="search"
      search
      autoFocus={autoFocus ?? (tvMode && onSearchRoute)}
      variant="ghost"
      classNameWrapper={wrapperClass}
      className="rounded-full"
      placeholder={t`Search movies, TV shows...`}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      aria-label={t`Search`}
      readOnly={tvTopbarLauncher}
      tabIndex={tvTopbarLauncher ? -1 : undefined}
      onClick={(e) => {
        if (tvTopbarLauncher) e.preventDefault();
      }}
    />
  );

  if (!tvMode) return field;

  if (onSearchRoute) {
    return (
      <TvFocusable
        focusRoot
        tv={{
          focusKey: "NAV-SEARCH",
          onPress: focusSearchInput,
          accessibilityLabel: t`Search`,
        }}
        className={cn(wrapperClass, "rounded-full")}
      >
        {field}
      </TvFocusable>
    );
  }

  return (
    <TvFocusable
      focusRoot
      tv={{
        focusKey: "NAV-SEARCH",
        onPress: openSearchPage,
        accessibilityLabel: t`Search`,
      }}
      className={cn(wrapperClass, "rounded-full")}
    >
      {field}
    </TvFocusable>
  );
}
