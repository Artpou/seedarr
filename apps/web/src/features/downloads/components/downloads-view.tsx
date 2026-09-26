import { useEffect, useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { ListMediaQuery } from "@seedarr/contracts";
import { useNavigate } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { LibraryIcon } from "lucide-react";

import { DiscoverSectionLabel } from "@/shared/components/discover-section-label";
import { SentinelStuck, StickyFilterBar } from "@/shared/components/sentinel/sentinel-stuck";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { Input } from "@/shared/ui/input";

import { DownloadButtonSynchronize } from "@/features/downloads/components/button/download-button-synchronize";
import { LibraryStats } from "@/features/downloads/components/download-stats";
import { DownloadTable } from "@/features/downloads/components/download-table";
import { MediaGrid } from "@/features/media/components/media-grid";
import { LibraryFiltersSheet } from "@/features/media/components/sheet/media-sheet-filter-library";
import { MediaTypeTabs } from "@/features/media/components/tabs/media-tabs-type";
import { MediaTabsViewMode } from "@/features/media/components/tabs/media-tabs-view-mode";
import { listQueryToSorting, sortingToListQuery } from "@/features/media/helpers/media-sort.helper";
import { useMediaList } from "@/features/media/hooks/use-media";
import { useEffectiveViewMode } from "@/features/settings/hooks/use-effective-view-mode";
import { buildDownloadsListQuery } from "@/routes/helpers/downloads-route.helper";

export interface DownloadsViewProps {
  search: Partial<ListMediaQuery>;
}

export function DownloadsView({ search }: DownloadsViewProps) {
  const {
    type,
    q: searchQ,
    with_genres: withGenres,
    release_date_gte,
    release_date_lte,
    with_runtime_gte,
    with_runtime_lte,
    vote_average_gte,
    sortBy,
    sortOrder,
  } = search;
  const navigate = useNavigate();
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState(searchQ ?? "");
  const [isStuck, setIsStuck] = useState(false);
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);
  const viewMode = useEffectiveViewMode("downloads");

  useEffect(() => {
    setQuery(searchQ ?? "");
  }, [searchQ]);

  useEffect(() => {
    if (isMobile) return;
    const next = debouncedQuery.trim() || undefined;
    if ((searchQ ?? undefined) === next) return;
    navigate({
      to: "/downloads",
      search: { ...search, q: next },
      resetScroll: false,
    });
  }, [debouncedQuery, isMobile, navigate, search, searchQ]);

  const effectiveQuery = (searchQ ?? "").trim();
  const listQuery = buildDownloadsListQuery(search);

  const mediaQuery = useMediaList(listQuery);
  const results = mediaQuery.data?.pages.flatMap((page) => page.results) ?? [];

  const sorting = listQueryToSorting({ sortBy, sortOrder });

  const handleSortingChange = (next: SortingState) => {
    const sort = sortingToListQuery(next);
    navigate({
      to: "/downloads",
      search: { ...search, sortBy: sort.sortBy, sortOrder: sort.sortOrder },
      resetScroll: false,
    });
  };

  const genreScope = type ?? "both";
  const filterType = type ?? "movie";
  const showViewMode = !isMobile || !isStuck;
  const showPageSearch = !isMobile;
  const showPageFilters = !isMobile;

  const libraryFilters = useMemo(
    () => ({
      with_genres: withGenres,
      release_date_gte,
      release_date_lte,
      with_runtime_gte,
      with_runtime_lte,
      vote_average_gte,
    }),
    [withGenres, release_date_gte, release_date_lte, with_runtime_gte, with_runtime_lte, vote_average_gte],
  );

  return (
    <Container>
      <div className="space-y-4">
        <LibraryStats />

        <SentinelStuck setIsStuck={setIsStuck} marginTop={-30} />

        {isMobile ? (
          <DiscoverSectionLabel icon={LibraryIcon}>
            <Trans>Library</Trans>
          </DiscoverSectionLabel>
        ) : (
          !isStuck && (
            <Input
              type="search"
              search
              classNameWrapper="w-full"
              h="lg"
              placeholder={t`Search in your library...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )
        )}

        <StickyFilterBar isStuck={isStuck}>
          {isStuck && showPageSearch ? (
            <div className="flex w-full items-center gap-2">
              <Input
                type="search"
                search
                classNameWrapper="w-full min-w-0 flex-1"
                h="lg"
                placeholder={t`Search in your library...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <LibraryFiltersSheet
                genreScope={genreScope}
                type={filterType}
                value={libraryFilters}
                onChange={(value) =>
                  navigate({
                    to: "/downloads",
                    search: { ...search, ...value },
                    resetScroll: false,
                  })
                }
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {showViewMode && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <MediaTabsViewMode scope="downloads" />
                  {!isMobile && <MediaTypeTabs value={type} />}
                </div>
              )}
              {showPageFilters && (
                <div className="flex items-center gap-2">
                  <LibraryFiltersSheet
                    genreScope={genreScope}
                    type={filterType}
                    value={libraryFilters}
                    onChange={(value) =>
                      navigate({
                        to: "/downloads",
                        search: { ...search, ...value },
                        resetScroll: false,
                      })
                    }
                  />
                  {showViewMode && <DownloadButtonSynchronize />}
                </div>
              )}
            </div>
          )}
        </StickyFilterBar>

        {results.length > 0 ? (
          viewMode === "grid" ? (
            <MediaGrid items={results} query={mediaQuery} showType downloadMode />
          ) : (
            <DownloadTable
              media={results}
              query={mediaQuery}
              sorting={sorting}
              onSortingChange={(updater) => {
                const next = typeof updater === "function" ? updater(sorting) : updater;
                handleSortingChange(next);
              }}
            />
          )
        ) : (
          <Card>
            <div className="py-10 text-center">
              <p className="text-muted-foreground">
                {effectiveQuery ? (
                  <Trans>No results found for "{effectiveQuery}"</Trans>
                ) : (
                  <Trans>No downloads yet</Trans>
                )}
              </p>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}
