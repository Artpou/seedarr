import type { ReactNode } from "react";

import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { MoonIcon, SearchIcon, SettingsIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS } from "@/shared/config/nav";
import { useTheme } from "@/shared/hooks/use-theme";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";
import { TvRouterLink } from "@/shared/ui/tv/tv-router-link";

import { useAuth } from "@/features/auth/auth-store";
import { tvSidebarVerticalArrow } from "@/features/tv-mode/tv-sidebar-arrow.helper";
import { useTvSidebarStore } from "@/features/tv-mode/tv-sidebar-store";
import { UserAvatar } from "@/features/user/components/user-avatar";
import type { SearchRouteType } from "@/routes/helpers/search-route.helper";
import { isSearchPath } from "@/routes/helpers/search-route.helper";

const PROFILE_LINK = msg({ id: "nav.profile", message: "Profile" });
const SEARCH_LINK = msg({ id: "nav.search", message: "Search" });
const TV_SEARCH = { mode: "tv" as const };

const FOCUS = {
  search: "NAV-/search",
  movies: "NAV-/movies",
  tv: "NAV-/tv",
  downloads: "NAV-/downloads",
  theme: "NAV-THEME",
  settings: "NAV-/settings",
} as const;

function sidebarItemClass(expanded: boolean, isActive: boolean): string {
  return cn(
    "flex shrink-0 items-center rounded-xl text-sm font-medium transition-[background-color,color] duration-200 outline-none",
    expanded ? "h-11 w-full gap-3 px-3" : "mx-auto size-11 justify-center",
    isActive ? "bg-primary/45 text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  );
}

function SidebarNavItem({
  to,
  params,
  focusKey,
  icon: Icon,
  label,
  isActive,
  expanded,
  onArrowPress,
}: {
  to: string;
  params?: Record<string, string>;
  focusKey: string;
  icon: LucideIcon;
  label: ReactNode;
  isActive: boolean;
  expanded: boolean;
  onArrowPress?: ReturnType<typeof tvSidebarVerticalArrow>["onArrowPress"];
}) {
  return (
    <TvRouterLink
      tvFocusKey={focusKey}
      to={to}
      params={params}
      search={TV_SEARCH}
      onArrowPress={onArrowPress}
      data-slot="nav-link"
      data-tv-sidebar-item
      className={sidebarItemClass(expanded, isActive)}
    >
      <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
      {expanded ? <span className="min-w-0 flex-1 truncate text-left">{label}</span> : null}
    </TvRouterLink>
  );
}

export function TvSidebar() {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useAuth((s) => s.user);
  const { theme, toggleTheme } = useTheme();
  const expanded = useTvSidebarStore((s) => s.expanded);

  const isProfileActive = pathname.startsWith("/user");
  const isSettingsActive = pathname.startsWith("/settings");
  const isSearchActive = isSearchPath(pathname);
  const displayName = currentUser?.pseudo || currentUser?.username || "";

  const profileFocusKey = currentUser ? `NAV-/user/$id-${currentUser.id}` : "NAV-PROFILE";

  const openSearch = () => {
    const type: SearchRouteType = pathname.startsWith("/tv") ? "tv" : "movie";
    void navigate({
      to: "/search",
      search: { ...TV_SEARCH, type, q: "" },
      resetScroll: false,
    });
  };

  return (
    <aside
      data-slot="tv-sidebar"
      className={cn(
        "sticky top-0 flex h-svh shrink-0 flex-col overflow-hidden border-r border-border bg-background py-4 transition-[width] duration-200 ease-out",
        expanded ? "w-56 px-3" : "w-[4.5rem] px-2",
      )}
      aria-label={t`Main navigation`}
    >
      {currentUser ? (
        <TvRouterLink
          tvFocusKey={profileFocusKey}
          to="/user/$id"
          params={{ id: currentUser.id }}
          search={TV_SEARCH}
          onArrowPress={tvSidebarVerticalArrow(undefined, FOCUS.search).onArrowPress}
          data-slot="nav-link"
          data-tv-sidebar-item
          accessibilityLabel={t(PROFILE_LINK)}
          className={cn(
            sidebarItemClass(expanded, isProfileActive),
            expanded ? "mb-2 h-auto min-h-11 py-2" : "mb-2",
            expanded && isProfileActive && "bg-primary/30",
          )}
        >
          <UserAvatar user={currentUser} size="xs" className="shrink-0" />
          {expanded ? (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">@{currentUser.username}</p>
            </div>
          ) : null}
        </TvRouterLink>
      ) : null}

      <nav className="flex flex-col gap-1 overflow-hidden" aria-label={t`Browse`}>
        <TvFocusable
          tv={{
            focusKey: FOCUS.search,
            onPress: openSearch,
            accessibilityLabel: t(SEARCH_LINK),
            ...tvSidebarVerticalArrow(profileFocusKey, FOCUS.movies),
          }}
          data-slot="nav-link"
          data-tv-sidebar-item
          className={sidebarItemClass(expanded, isSearchActive)}
        >
          <SearchIcon className="size-5 shrink-0 opacity-90" aria-hidden />
          {expanded ? <span className="min-w-0 flex-1 truncate text-left">{t(SEARCH_LINK)}</span> : null}
        </TvFocusable>

        {APP_NAV_ITEMS.map((item, index) => {
          const isActive = pathname.startsWith(item.url);
          const focusKey = `NAV-${item.url}`;
          const upKey = index === 0 ? FOCUS.search : `NAV-${APP_NAV_ITEMS[index - 1]?.url}`;
          const downKey = index === APP_NAV_ITEMS.length - 1 ? FOCUS.theme : `NAV-${APP_NAV_ITEMS[index + 1]?.url}`;

          return (
            <SidebarNavItem
              key={item.url}
              to={item.url}
              focusKey={focusKey}
              icon={item.mobileIcon ?? item.icon}
              label={t(item.title)}
              isActive={isActive}
              expanded={expanded}
              onArrowPress={tvSidebarVerticalArrow(upKey, downKey).onArrowPress}
            />
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border/60 pt-3">
        <TvFocusable
          tv={{
            focusKey: FOCUS.theme,
            onPress: toggleTheme,
            accessibilityLabel: theme === "dark" ? t`Light mode` : t`Dark mode`,
            ...tvSidebarVerticalArrow(FOCUS.downloads, FOCUS.settings),
          }}
          data-slot="nav-link"
          data-tv-sidebar-item
          className={sidebarItemClass(expanded, false)}
        >
          {theme === "dark" ? (
            <SunIcon className="size-5 shrink-0" aria-hidden />
          ) : (
            <MoonIcon className="size-5 shrink-0" aria-hidden />
          )}
          {expanded ? (
            <span className="min-w-0 flex-1 truncate text-left">
              {theme === "dark" ? <Trans>Light mode</Trans> : <Trans>Dark mode</Trans>}
            </span>
          ) : null}
        </TvFocusable>

        <SidebarNavItem
          to="/settings"
          focusKey={FOCUS.settings}
          icon={SettingsIcon}
          label={<Trans>Settings</Trans>}
          isActive={isSettingsActive}
          expanded={expanded}
          onArrowPress={tvSidebarVerticalArrow(FOCUS.theme, undefined).onArrowPress}
        />
      </div>
    </aside>
  );
}
