import { useEffect, useMemo, useState } from "react";

import { Trans } from "@lingui/react/macro";
import type { ListMediaQuery } from "@seedarr/contracts";
import { useInfiniteQuery, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { BookmarkIcon, CalendarIcon, ClockIcon, HeartIcon } from "lucide-react";

import { BadgeRole } from "@/shared/components/badge/badge-role";
import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { SentinelStuck, StickyFilterBar } from "@/shared/components/sentinel/sentinel-stuck";
import { StatSurfaceGlow } from "@/shared/components/stats/stat-surface";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { flattenInfiniteResults } from "@/shared/hooks/use-infinite-list";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Badge } from "@/shared/ui/badge";
import { Container } from "@/shared/ui/container";

import { useAuth } from "@/features/auth/auth-store";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaTable } from "@/features/media/components/media-table";
import type { LibraryFiltersValue } from "@/features/media/components/sheet/media-sheet-filter-library";
import { LibraryFiltersSheet } from "@/features/media/components/sheet/media-sheet-filter-library";
import { MediaTabsViewMode } from "@/features/media/components/tabs/media-tabs-view-mode";
import { listQueryToSorting, sortingToListQuery } from "@/features/media/helpers/media-sort.helper";
import { mediaQueries } from "@/features/media/hooks/media.queries";
import { RequestCarousel } from "@/features/request/components/request-carousel";
import { requestQueries } from "@/features/request/hooks/request.queries";
import { useEffectiveViewMode } from "@/features/settings/hooks/use-effective-view-mode";
import { UserAvatar } from "@/features/user/components/user-avatar";
import { UserProfileStats } from "@/features/user/components/user-profile-stats";
import { userQueries } from "@/features/user/hooks/user.queries";
import { ProfileCalendar } from "@/features/user/profile-calendar";
import { type ProfileRouteSearch, pickProfileLibraryFilters } from "@/routes/helpers/profile-route.helper";

type ProfileTab = "calendar" | "watchlist" | "liked" | "history";

type ProfileListBase = Pick<
  ListMediaQuery,
  | "userId"
  | "with_genres"
  | "release_date_gte"
  | "release_date_lte"
  | "with_runtime_gte"
  | "with_runtime_lte"
  | "vote_average_gte"
  | "q"
  | "sortBy"
  | "sortOrder"
>;

export interface UserProfileViewProps {
  userId: string;
  search: ProfileRouteSearch;
}

export function UserProfileView({ userId: id, search }: UserProfileViewProps) {
  const navigate = useNavigate();
  const currentUser = useAuth((s) => s.user);
  const isOwnProfile = currentUser?.id === id;
  const viewMode = useEffectiveViewMode("profile");
  const isMobile = useIsMobile();
  const mobileOwnProfile = isMobile && isOwnProfile;
  const [tab, setTab] = useState<ProfileTab>("calendar");
  const [query, setQuery] = useState(search.q ?? "");
  const debouncedSearch = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);
  const [isStuck, setIsStuck] = useState(false);
  const [localLibraryFilters, setLocalLibraryFilters] = useState<LibraryFiltersValue>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortQuery = sortingToListQuery(sorting);

  const { data: profileUser } = useSuspenseQuery(userQueries.details(id));
  const { data: requestsData = [] } = useQuery({ ...requestQueries.mine(), enabled: isOwnProfile });
  const pendingRequests = useMemo(
    () =>
      requestsData.filter((r) => {
        const status = (r as { status?: string }).status;
        return !status || status === "pending";
      }),
    [requestsData],
  );

  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    if (isOwnProfile) return;
    const next = debouncedSearch.trim() || undefined;
    if ((search.q ?? undefined) === next) return;
    void navigate({
      to: "/user/$id",
      params: { id },
      search: { ...search, q: next },
      resetScroll: false,
    });
  }, [debouncedSearch, id, isOwnProfile, navigate, search, search.q]);

  const libraryFilters = isOwnProfile ? pickProfileLibraryFilters(search) : localLibraryFilters;
  const effectiveSearch = isOwnProfile ? (search.q ?? "").trim() : debouncedSearch.trim();

  const listBase: ProfileListBase = {
    userId: id,
    with_genres: libraryFilters.with_genres,
    release_date_gte: libraryFilters.release_date_gte,
    release_date_lte: libraryFilters.release_date_lte,
    with_runtime_gte: libraryFilters.with_runtime_gte,
    with_runtime_lte: libraryFilters.with_runtime_lte,
    vote_average_gte: libraryFilters.vote_average_gte,
    q: effectiveSearch || undefined,
    ...sortQuery,
  };

  const watchListQuery = useInfiniteQuery({
    ...mediaQueries.list({ filter: "watch-list", ...listBase, limit: 40 }),
    enabled: tab === "watchlist" && !mobileOwnProfile,
  });
  const likesQuery = useInfiniteQuery({
    ...mediaQueries.list({ filter: "like", ...listBase, limit: 40 }),
    enabled: tab === "liked" && !mobileOwnProfile,
  });
  const historyQuery = useInfiniteQuery({
    ...mediaQueries.list({ filter: "history", ...listBase, limit: 40 }),
    enabled: tab === "history" && !mobileOwnProfile,
  });

  const watchListItems = flattenInfiniteResults(watchListQuery);
  const likesItems = flattenInfiniteResults(likesQuery);
  const historyItems = flattenInfiniteResults(historyQuery);
  const displayName = profileUser.pseudo || profileUser.username;
  const showPageToolbar = !mobileOwnProfile;

  const availableTabs = useMemo(
    () => [
      { value: "calendar" as const, label: <Trans>Calendar</Trans>, icon: CalendarIcon },
      { value: "watchlist" as const, label: <Trans>Watchlist</Trans>, icon: BookmarkIcon },
      { value: "liked" as const, label: <Trans>Liked</Trans>, icon: HeartIcon },
      { value: "history" as const, label: <Trans>Watch history</Trans>, icon: ClockIcon },
    ],
    [],
  );

  const activeQuery = tab === "watchlist" ? watchListQuery : tab === "liked" ? likesQuery : historyQuery;

  return (
    <Container>
      {!mobileOwnProfile && (
        <StatSurfaceGlow className="mb-1 p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10 xl:gap-14">
            <div className="flex shrink-0 flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6 lg:max-w-[min(100%,28rem)]">
              <div className="relative shrink-0">
                <div className="absolute -inset-2 rounded-full bg-primary/25 blur-xl opacity-60" aria-hidden />
                <div className="relative rounded-full ring-2 ring-background/80 ring-offset-2 ring-offset-background/50">
                  <UserAvatar user={profileUser} editable />
                </div>
              </div>

              <div className="flex max-w-md flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                <h2 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{displayName}</h2>
                <p className="text-sm text-muted-foreground/90">@{profileUser.username}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <BadgeRole role={profileUser.role} />
                  {profileUser.createdAt && (
                    <Badge variant="outline" className="border-border/50 bg-background/30 font-normal backdrop-blur-sm">
                      <CalendarIcon className="size-3.5 opacity-70" />
                      {new Date(profileUser.createdAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <UserProfileStats userId={id} className="lg:min-w-[min(100%,24rem)]" />
          </div>
        </StatSurfaceGlow>
      )}

      {mobileOwnProfile && (
        <div className="mb-2">
          <UserProfileStats userId={id} />
        </div>
      )}

      {isOwnProfile && pendingRequests.length > 0 && (
        <RequestCarousel
          requests={pendingRequests}
          seeMoreTo={`/user/${id}/requests`}
          seeMoreSearch={{ status: "pending" }}
        />
      )}

      <div className="space-y-4">
        {showPageToolbar && (
          <>
            <SentinelStuck setIsStuck={setIsStuck} marginTop={-30} />
            <StickyFilterBar isStuck={isStuck}>
              {isStuck && isOwnProfile ? (
                <div className="flex w-full items-center gap-2">
                  <LibraryFiltersSheet
                    genreScope="both"
                    type="movie"
                    value={libraryFilters}
                    onChange={(value) => {
                      setSorting([]);
                      if (isOwnProfile) {
                        void navigate({
                          to: "/user/$id",
                          params: { id },
                          search: { ...search, ...value },
                          resetScroll: false,
                        });
                      } else {
                        setLocalLibraryFilters(value);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex w-full flex-row items-center gap-2 sm:w-fit">
                    <MediaTabsViewMode scope="profile" />
                    <ResponsiveTabs
                      className="min-w-0 flex-1"
                      value={tab}
                      onValueChange={(v) => {
                        setSorting([]);
                        setTab(v as ProfileTab);
                      }}
                      options={availableTabs.map(({ value, label, icon }) => ({
                        value,
                        label,
                        icon,
                      }))}
                    />
                  </div>
                  <LibraryFiltersSheet
                    genreScope="both"
                    type="movie"
                    value={libraryFilters}
                    onChange={(value) => {
                      setSorting([]);
                      if (isOwnProfile) {
                        void navigate({
                          to: "/user/$id",
                          params: { id },
                          search: { ...search, ...value },
                          resetScroll: false,
                        });
                      } else {
                        setLocalLibraryFilters(value);
                      }
                    }}
                  />
                </div>
              )}
            </StickyFilterBar>
          </>
        )}

        {mobileOwnProfile || tab === "calendar" ? (
          <ProfileCalendar listBase={listBase} viewMode={viewMode} />
        ) : (
          (() => {
            const items = tab === "watchlist" ? watchListItems : tab === "liked" ? likesItems : historyItems;
            if (!activeQuery.isPending && items.length === 0) {
              return (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  <Trans>Nothing here yet</Trans>
                </p>
              );
            }
            if (viewMode === "grid") {
              return <MediaGrid items={items} query={activeQuery} showType />;
            }
            return (
              <MediaTable
                media={items}
                query={activeQuery}
                sorting={listQueryToSorting(sortQuery)}
                onSortingChange={setSorting}
              />
            );
          })()
        )}
      </div>
    </Container>
  );
}
