import { useMemo } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";

import { TopbarRouteSearch } from "@/shared/components/topbar/topbar-route-search";

import { DownloadButtonSynchronize } from "@/features/downloads/components/button/download-button-synchronize";
import { LibraryFiltersSheet } from "@/features/media/components/sheet/media-sheet-filter-library";
import { validateDownloadsSearch } from "@/routes/helpers/downloads-route.helper";

export function TopbarDownloads() {
  const location = useLocation();
  const navigate = useNavigate();
  const search = useMemo(() => validateDownloadsSearch(location.search as Record<string, unknown>), [location.search]);

  const genreScope = search.type ?? "both";
  const filterType = search.type ?? "movie";

  const libraryFilters = useMemo(
    () => ({
      with_genres: search.with_genres,
      release_date_gte: search.release_date_gte,
      release_date_lte: search.release_date_lte,
      with_runtime_gte: search.with_runtime_gte,
      with_runtime_lte: search.with_runtime_lte,
      vote_average_gte: search.vote_average_gte,
    }),
    [
      search.with_genres,
      search.release_date_gte,
      search.release_date_lte,
      search.with_runtime_gte,
      search.with_runtime_lte,
      search.vote_average_gte,
    ],
  );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <TopbarRouteSearch />
      <LibraryFiltersSheet
        genreScope={genreScope}
        type={filterType}
        value={libraryFilters}
        triggerVariant="ghost"
        onChange={(value) =>
          navigate({
            to: "/downloads",
            search: { ...search, ...value },
            resetScroll: false,
          })
        }
      />
      <DownloadButtonSynchronize topbar />
    </div>
  );
}
