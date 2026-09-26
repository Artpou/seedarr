import { useEffect, useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { ListMediaQuery } from "@seedarr/contracts";
import type { Media } from "@seedarr/sdk";
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { BookmarkIcon, CalendarIcon, ClockIcon, HeartIcon } from "lucide-react";

import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { SentinelStuck, StickyFilterBar } from "@/shared/components/sentinel/sentinel-stuck";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { flattenInfiniteResults, type InfiniteResultsQuery } from "@/shared/hooks/use-infinite-list";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { Input } from "@/shared/ui/input";

import { useAuth } from "@/features/auth/auth-store";
import { MediaCalendar } from "@/features/media/components/media-calendar";
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
import { RoleBadge } from "@/features/user/components/role-badge";
import { UserAvatar } from "@/features/user/components/user-avatar";
import { UserProfileStats } from "@/features/user/components/user-profile-stats";
import { userQueries } from "@/features/user/hooks/user.queries";
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

function ProfileCalendar({ listBase, viewMode }: { listBase: ProfileListBase; viewMode: "grid" | "list" }) {
  const calendarQuery = useInfiniteQuery({
    ...mediaQueries.list({ filter: "calendar", ...listBase, limit: 100 }),
  });

  useEffect(() => {
    if (calendarQuery.hasNextPage && !calendarQuery.isFetchingNextPage) {
      void calendarQuery.fetchNextPage();
    }
  }, [calendarQuery.hasNextPage, calendarQuery.isFetchingNextPage, calendarQuery.fetchNextPage]);

  const calendarItems = flattenInfiniteResults(calendarQuery);
  return <MediaCalendar items={calendarItems} viewMode={viewMode} />;
}

function ProfileOwnPendingRequests({ userId }: { userId: string }) {
  const { data: requestsData } = useSuspenseQuery(requestQueries.mine());
  const pendingRequests = useMemo(
    () =>
      requestsData.filter((r) => {
        const status = (r as { status?: string }).status;
        return !status || status === "pending";
      }),
    [requestsData],
  );

  if (pendingRequests.length === 0) return null;

  return (
    <RequestCarousel
      requests={pendingRequests}
      seeMoreTo={`/user/${userId}/requests`}
      seeMoreSearch={{ status: "pending" }}
    />
  );
}

function MediaCollectionView({
  items,
  query,
  viewMode,
  sorting,
  onSortingChange,
}: {
  items: Media[];
  query: InfiniteResultsQuery<Media>;
  viewMode: "grid" | "list";
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
}) {
  if (!query.isPending && items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        <Trans>Nothing here yet</Trans>
      </p>
    );
  }

  if (viewMode === "grid") {
    return <MediaGrid items={items} query={query} showType />;
  }

  return <MediaTable media={items} query={query} sorting={sorting} onSortingChange={onSortingChange} />;
}

export interface UserProfileViewProps {
  userId: string;
  search: ProfileRouteSearch;
}

export function UserProfileView({ userId: id, search }: UserProfileViewProps) {
  const { t } = useLingui();
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

  useEffect(() => {
    setQuery(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    if (mobileOwnProfile) return;
    if (!isOwnProfile) return;
    const next = debouncedSearch.trim() || undefined;
    if ((search.q ?? undefined) === next) return;
    void navigate({
      to: "/user/$id",
      params: { id },
      search: { ...search, q: next },
      resetScroll: false,
    });
  }, [debouncedSearch, id, isOwnProfile, mobileOwnProfile, navigate, search, search.q]);

  const libraryFilters = mobileOwnProfile ? pickProfileLibraryFilters(search) : localLibraryFilters;
  const effectiveSearch = mobileOwnProfile ? (search.q ?? "").trim() : debouncedSearch.trim();

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
        <div className="flex w-full flex-col items-center justify-between gap-6 lg:flex-row lg:items-start">
          <Card className="flex w-full flex-row items-center gap-6 p-6 lg:min-w-[520px] lg:w-auto">
            <div className="flex max-w-[250px] justify-center lg:justify-start">
              <UserAvatar user={profileUser} editable />
            </div>

            <div className="flex w-full max-w-md flex-col gap-1">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <h2 className="truncate">{displayName}</h2>
              </div>
              <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <RoleBadge role={profileUser.role} />
                {profileUser.createdAt && (
                  <Badge variant="outline">
                    <CalendarIcon className="size-3.5" />
                    {new Date(profileUser.createdAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <UserProfileStats userId={id} />
          </div>
        </div>
      )}

      {mobileOwnProfile && <UserProfileStats userId={id} />}

      {isOwnProfile && <ProfileOwnPendingRequests userId={id} />}

      <div className="space-y-4">
        {showPageToolbar && (
          <>
            <SentinelStuck setIsStuck={setIsStuck} marginTop={-30} />
            {!isStuck && (
              <Input
                type="search"
                search
                classNameWrapper="w-full"
                h="lg"
                placeholder={t`Search in my profile...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}

            <StickyFilterBar isStuck={isStuck}>
              {isStuck ? (
                <div className="flex w-full items-center gap-2">
                  <Input
                    type="search"
                    search
                    classNameWrapper="w-full min-w-0 flex-1"
                    className="h-10"
                    placeholder={t`Search in my profile...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <LibraryFiltersSheet
                    genreScope="both"
                    type="movie"
                    value={libraryFilters}
                    onChange={(value) => {
                      setSorting([]);
                      setLocalLibraryFilters(value);
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
                      setLocalLibraryFilters(value);
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
          <MediaCollectionView
            items={tab === "watchlist" ? watchListItems : tab === "liked" ? likesItems : historyItems}
            query={activeQuery}
            viewMode={viewMode}
            sorting={listQueryToSorting(sortQuery)}
            onSortingChange={setSorting}
          />
        )}
      </div>
    </Container>
  );
}
