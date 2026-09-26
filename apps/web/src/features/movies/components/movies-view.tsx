import { Trans } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";

import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";

import { MediaDiscover } from "@/features/media/components/media-discover";
import { getDiscoverMainQueryOptions } from "@/features/media/helpers/discover-query.helper";
import { type MovieDiscoverSearch, pickMovieFilters } from "@/features/media/helpers/discover-search.helper";
import { MovieFiltersSheet } from "@/features/movies/components/movie-filters-sheet";

export interface MoviesViewProps {
  search: MovieDiscoverSearch;
}

export function MoviesView({ search }: MoviesViewProps) {
  const locale = useTmdbLocale();
  const navigate = useNavigate();

  const handleSearchChange = (value: Partial<MovieDiscoverSearch>) => {
    const next = { ...search, ...value };
    navigate({ to: "/movies", search: next, resetScroll: false });
  };

  const queryOptions = getDiscoverMainQueryOptions("movie", search, locale);

  return (
    <MediaDiscover
      type="movie"
      search={search}
      queryOptions={queryOptions}
      filtersSheet={<MovieFiltersSheet value={pickMovieFilters(search)} onChange={handleSearchChange} />}
      emptyTitle={<Trans>No movies found</Trans>}
      emptySubtitle={<Trans>Try adjusting your filters or criteria</Trans>}
    />
  );
}
