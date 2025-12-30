import { useMemo } from "react";

import { Trans } from "@lingui/react/macro";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { SortOption } from "tmdb-ts";

import { Container } from "@/shared/ui/container";

import { MediaCarousel } from "@/features/media/components/media-carousel";
import { MediaCategoryCarousel } from "@/features/media/components/media-category-carousel";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaSortTabs } from "@/features/media/components/media-sort-tabs";
import { useRecentlyViewed } from "@/features/media/hooks/use-media";
import { useTVDiscover } from "@/features/tv/hook/use-tv";

export interface TVSearchParams {
  sort_by?: SortOption;
  with_genres?: string;
}

export const Route = createFileRoute("/_app/tv")({
  component: TVPage,
  validateSearch: (search: Record<string, unknown>): TVSearchParams => {
    return {
      sort_by: (typeof search.sort_by === "string"
        ? search.sort_by
        : "popularity.desc") as SortOption,
      with_genres: typeof search.with_genres === "string" ? search.with_genres : undefined,
    };
  },
});

function TVPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: recentlyViewedTV = [] } = useRecentlyViewed("tv", 20);
  // biome-ignore lint/suspicious/noExplicitAny: TMDB library type limitation with string sort_by
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTVDiscover(
    search as any,
  );

  const tvShows = useMemo(() => {
    return data?.pages.flatMap((page) => page.results) ?? [];
  }, [data]);

  const handleSearchChange = (updates: Partial<TVSearchParams>) => {
    navigate({
      to: "/tv",
      search: {
        ...search,
        ...updates,
      },
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Container>
      <MediaCategoryCarousel type="tv" onValueChange={handleSearchChange} />

      {recentlyViewedTV.length > 0 && (
        <MediaCarousel
          title={
            <div className="flex items-center gap-2">
              <EyeIcon /> <Trans>Recently Viewed</Trans>
            </div>
          }
          data={recentlyViewedTV}
        />
      )}

      <div className="space-y-4">
        <MediaSortTabs
          value={search.sort_by ?? "popularity.desc"}
          onValueChange={handleSearchChange}
        />
        <MediaGrid
          items={tvShows}
          isLoading={isLoading || isFetchingNextPage}
          onLoadMore={handleLoadMore}
        />
      </div>
    </Container>
  );
}
