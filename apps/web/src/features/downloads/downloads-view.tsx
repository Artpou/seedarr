import { useCallback, useEffect, useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { ListMediaQuery } from "@seedarr/contracts";
import type { Media } from "@seedarr/sdk";
import { useNavigate } from "@tanstack/react-router";
import { type OnChangeFn, type RowSelectionState, type SortingState, useTable } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { LibraryIcon, Trash2Icon } from "lucide-react";

import { DiscoverSectionLabel } from "@/shared/components/discover-section-label";
import { InfiniteSentinel } from "@/shared/components/sentinel/infinite-sentinel";
import { SentinelStuck, StickyFilterBar } from "@/shared/components/sentinel/sentinel-stuck";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { flattenInfiniteResults, type InfiniteResultsQuery } from "@/shared/hooks/use-infinite-list";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";

import { useAuth } from "@/features/auth/auth-store";
import { useRole } from "@/features/auth/hooks/use-role";
import { DownloadButtonSynchronize } from "@/features/downloads/components/button/download-button-synchronize";
import { DownloadModalDelete } from "@/features/downloads/components/download-modal-delete";
import { LibraryStats } from "@/features/downloads/components/download-stats";
import { useBatchDeleteDownloads } from "@/features/downloads/hooks/download.queries";
import {
  downloadTableFeatures,
  type MediaWithDownload,
  useDownloadTableColumns,
} from "@/features/downloads/hooks/use-download-table-columns";
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
    <Container className="space-y-1 sm:space-y-3">
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
          <DownloadsLibraryTable
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
    </Container>
  );
}

function DownloadsLibraryTable({
  media,
  query,
  sorting,
  onSortingChange,
}: {
  media?: Media[];
  query?: InfiniteResultsQuery<Media>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
}) {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const currentUser = useAuth((s) => s.user);
  const batchDelete = useBatchDeleteDownloads();

  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const items = useMemo(
    () => (media ?? flattenInfiniteResults(query)).filter((m): m is MediaWithDownload => Boolean(m.download)),
    [media, query],
  );
  const resolvedSorting = sorting ?? localSorting;
  const resolvedOnSortingChange = onSortingChange ?? setLocalSorting;
  const manualSorting = Boolean(onSortingChange);

  const canDelete = useCallback(
    (download: MediaWithDownload["download"]) => isAdmin || download.userId === currentUser?.id,
    [isAdmin, currentUser?.id],
  );

  const onDelete = useCallback((rowId: string) => {
    setRowSelection({ [rowId]: true });
    setDeleteDialogOpen(true);
  }, []);

  const columns = useDownloadTableColumns({ canDelete, onDelete });

  const table = useTable({
    features: downloadTableFeatures,
    data: items,
    columns,
    getRowId: (row) => row.download.id,
    manualSorting,
    onSortingChange: resolvedOnSortingChange,
    onRowSelectionChange: setRowSelection,
    state: { sorting: resolvedSorting, rowSelection },
  });

  const selectedIds = table.getFilteredSelectedRowModel().rows.map((r) => r.original.download.id);
  const someSelected = selectedIds.length > 0;

  return (
    <div className="space-y-2">
      {someSelected && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2 mb-2">
          <span className="text-sm font-medium">
            {selectedIds.length} <Trans>selected</Trans>
          </span>
          <Button variant="destructive" size="sm" icon={Trash2Icon} onClick={() => setDeleteDialogOpen(true)}>
            <Trans>Delete</Trans>
          </Button>
        </div>
      )}

      <DataTable
        table={table}
        empty={<Trans>No downloads</Trans>}
        onRowClick={(row) => navigate({ to: "/downloads/$id", params: { id: row.original.download.id } })}
      />

      <InfiniteSentinel query={query} />

      <DownloadModalDelete
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        showLibraryOnly
        pending={batchDelete.isPending}
        title={
          selectedIds.length > 1 ? <Trans>Delete {selectedIds.length} downloads</Trans> : <Trans>Delete Download</Trans>
        }
        description={
          selectedIds.length > 1 ? (
            <Trans>
              Are you sure you want to delete these {selectedIds.length} downloads? This action cannot be undone.
            </Trans>
          ) : (
            <Trans>Are you sure you want to delete this download? This action cannot be undone.</Trans>
          )
        }
        onConfirm={(libraryOnly) => {
          batchDelete.mutate(
            { ids: selectedIds, dbOnly: libraryOnly },
            {
              onSuccess: () => {
                setRowSelection({});
                setDeleteDialogOpen(false);
              },
            },
          );
        }}
      />
    </div>
  );
}
