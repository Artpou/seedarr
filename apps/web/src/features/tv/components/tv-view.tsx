import { Trans } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";

import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";

import { MediaDiscover } from "@/features/media/components/media-discover";
import { getDiscoverMainQueryOptions } from "@/features/media/helpers/discover-query.helper";
import { pickTvFilters, type TvDiscoverSearch } from "@/features/media/helpers/discover-search.helper";
import { TvFiltersSheet } from "@/features/tv/components/tv-filters-sheet";

export interface TvViewProps {
  search: TvDiscoverSearch;
}

export function TvView({ search }: TvViewProps) {
  const locale = useTmdbLocale();
  const navigate = useNavigate();

  const handleSearchChange = (value: Partial<TvDiscoverSearch>) => {
    const next = { ...search, ...value };
    navigate({ to: "/tv", search: next, resetScroll: false });
  };

  const queryOptions = getDiscoverMainQueryOptions("tv", search, locale);

  return (
    <MediaDiscover
      type="tv"
      search={search}
      queryOptions={queryOptions}
      filtersSheet={<TvFiltersSheet value={pickTvFilters(search)} onChange={handleSearchChange} />}
      emptyTitle={<Trans>No TV shows found</Trans>}
      emptySubtitle={<Trans>Try adjusting your filters or criteria</Trans>}
    />
  );
}
