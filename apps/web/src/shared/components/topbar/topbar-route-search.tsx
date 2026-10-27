import { useMemo } from "react";

import { useLingui } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { TopbarGlobalSearch } from "@/shared/components/topbar/topbar-global-search";
import { getTopbarMode } from "@/shared/components/topbar/topbar-route.helper";
import { TopbarSearchField } from "@/shared/components/topbar/topbar-search-field";

import { useAuth } from "@/features/auth/auth-store";
import { tvNavLibrarySearchFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { validateRequestsSearch } from "@/routes/helpers/requests-route.helper";
import type { SearchRouteType } from "@/routes/helpers/search-route.helper";
import { useTopbarDownloadsSearch } from "./use-topbar-downloads-search";
import { useTopbarProfileSearch } from "./use-topbar-profile-search";
import { useTopbarSettingsSearch } from "./use-topbar-settings-search";

type TopbarRouteSearchProps = {
  classNameWrapper?: string;
  autoFocus?: boolean;
};

export function TopbarRouteSearch({ classNameWrapper, autoFocus }: TopbarRouteSearchProps) {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const tvMode = useTvMode();
  const currentUser = useAuth((s) => s.user);
  const mode = getTopbarMode(location.pathname, currentUser?.id, location.search as Record<string, unknown>);

  const library = useTopbarDownloadsSearch();
  const profile = useTopbarProfileSearch();
  const settings = useTopbarSettingsSearch();

  const requestsSearch = useMemo(
    () => validateRequestsSearch(location.search as Record<string, unknown>),
    [location.search],
  );

  const fieldProps = { classNameWrapper };

  if (mode === "downloads") {
    return (
      <TopbarSearchField
        {...fieldProps}
        value={library.query}
        onChange={(q) => library.setQuery(q ?? "")}
        placeholder={t`Search in your library...`}
        tvFocusKey={tvMode ? tvNavLibrarySearchFocusKey : undefined}
        tvAccessibilityLabel={t`Search in your library`}
      />
    );
  }

  if (mode === "profile" && profile.onProfile) {
    return (
      <TopbarSearchField
        {...fieldProps}
        value={profile.query}
        onChange={(q) => profile.setQuery(q ?? "")}
        placeholder={t`Search in my profile...`}
      />
    );
  }

  if (mode === "settings" && settings.target) {
    const placeholder =
      settings.target.kind === "modules"
        ? t`Search modules…`
        : settings.target.kind === "activity"
          ? t`Search activity…`
          : t`Search users…`;
    return (
      <TopbarSearchField
        {...fieldProps}
        value={settings.query}
        onChange={(q) => settings.setQuery(q ?? "")}
        placeholder={placeholder}
      />
    );
  }

  if (mode === "requests") {
    return (
      <TopbarSearchField
        {...fieldProps}
        value={requestsSearch.q}
        onChange={(q) =>
          navigate({
            to: "/requests",
            search: { ...requestsSearch, q },
            resetScroll: false,
          })
        }
        placeholder={t`Search a request...`}
      />
    );
  }

  const defaultType: SearchRouteType | undefined =
    mode === "tv" || mode === "tv-scoped" ? "tv" : mode === "movies" || mode === "movies-scoped" ? "movie" : undefined;

  return (
    <TopbarGlobalSearch
      defaultType={defaultType}
      classNameWrapper={classNameWrapper}
      autoFocus={autoFocus ?? mode === "search"}
    />
  );
}
