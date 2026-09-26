import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { BookmarkIcon, CalendarIcon, ClockIcon, HeartIcon, LogOutIcon, SettingsIcon } from "lucide-react";

import { TopbarSearchField } from "@/shared/components/topbar/topbar-search-field";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@/shared/ui/dropdrawer";

import { useAuth } from "@/features/auth/auth-store";
import { useLogout } from "@/features/auth/hooks/auth.queries";
import { RoleBadge } from "@/features/user/components/role-badge";
import { UserAvatar } from "@/features/user/components/user-avatar";
import { userQueries } from "@/features/user/hooks/user.queries";
import type { ProfileRouteSearch } from "@/routes/helpers/profile-route.helper";

interface TopbarProfileProps {
  userId: string;
}

export function TopbarProfile({ userId }: TopbarProfileProps) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const location = useLocation();
  const search = location.search as ProfileRouteSearch;
  const authUser = useAuth((s) => s.user);
  const { data: profileUser } = useQuery(userQueries.details(userId));
  const user = profileUser ?? authUser;
  const logoutMutation = useLogout(() => {
    navigate({ to: "/login" });
  });

  if (!user) return null;

  const displayName = user.pseudo || user.username;

  const updateSearch = (patch: Partial<ProfileRouteSearch>) => {
    void navigate({
      to: location.pathname,
      search: { ...search, ...patch },
      resetScroll: false,
    });
  };

  const goTo = (to: "/user/$id" | "/user/$id/likes" | "/user/$id/watch-list" | "/user/$id/history") => {
    void navigate({ to, params: { id: userId }, search, resetScroll: false });
  };

  return (
    <>
      <DropDrawer>
        <DropDrawerTrigger asChild>
          <button
            type="button"
            className="p-0! shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t`Open profile`}
          >
            <UserAvatar user={user} size="xs" />
          </button>
        </DropDrawerTrigger>
        <DropDrawerContent>
          <div className="flex flex-col items-center gap-3 px-4 pb-2 pt-2">
            <UserAvatar user={user} size="md" editable />
            <div className="flex w-full flex-col items-center gap-1 text-center">
              <div className="flex items-center gap-2">
                <span className="truncate text-lg font-semibold">{displayName}</span>
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                {profileUser ? <RoleBadge role={profileUser.role} /> : null}
                {profileUser?.createdAt ? (
                  <Badge variant="outline">
                    <CalendarIcon className="size-3.5" />
                    {new Date(profileUser.createdAt).toLocaleDateString()}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <DropDrawerGroup>
            <DropDrawerItem onSelect={() => goTo("/user/$id")} icon={<CalendarIcon className="size-4" />}>
              <Trans>Calendar</Trans>
            </DropDrawerItem>
            <DropDrawerItem onSelect={() => goTo("/user/$id/watch-list")} icon={<BookmarkIcon className="size-4" />}>
              <Trans>Watchlist</Trans>
            </DropDrawerItem>
            <DropDrawerItem onSelect={() => goTo("/user/$id/likes")} icon={<HeartIcon className="size-4" />}>
              <Trans>Liked</Trans>
            </DropDrawerItem>
            <DropDrawerItem onSelect={() => goTo("/user/$id/history")} icon={<ClockIcon className="size-4" />}>
              <Trans>Watch history</Trans>
            </DropDrawerItem>
            <DropDrawerItem
              onSelect={() => logoutMutation.mutate()}
              icon={<LogOutIcon className="size-4" />}
              className="text-destructive focus:text-destructive"
            >
              <Trans>Sign out</Trans>
            </DropDrawerItem>
          </DropDrawerGroup>
        </DropDrawerContent>
      </DropDrawer>

      <TopbarSearchField
        value={search.q}
        onChange={(q) => updateSearch({ q })}
        placeholder={t`Search in my profile...`}
      />

      <Button
        variant="ghost"
        size="icon"
        icon={SettingsIcon}
        onClick={() => navigate({ to: "/settings", search: {} })}
      />
    </>
  );
}
