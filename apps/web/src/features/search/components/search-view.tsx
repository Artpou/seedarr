import { useEffect, useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";
import { FilmIcon, SearchIcon, TvIcon } from "lucide-react";

import { InfiniteSentinel } from "@/shared/components/sentinel/infinite-sentinel";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { flattenInfiniteResults } from "@/shared/hooks/use-infinite-list";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";
import { Container } from "@/shared/ui/container";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaTable } from "@/features/media/components/media-table";
import { MediaTabsViewMode } from "@/features/media/components/tabs/media-tabs-view-mode";
import { buildMovieDiscoverOptions, buildTvDiscoverOptions } from "@/features/media/helpers/discover-search.helper";
import { MovieFiltersSheet } from "@/features/movies/components/movie-filters-sheet";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { useEffectiveViewMode } from "@/features/settings/hooks/use-effective-view-mode";
import { TvFiltersSheet } from "@/features/tv/components/tv-filters-sheet";
import { tvQueries } from "@/features/tv/hooks/tv.queries";
import {
  clearSearchFilters,
  hasActiveSearchFilters,
  pickMovieSearchFilters,
  pickTvSearchFilters,
  type SearchRouteSearch,
  type SearchRouteType,
  shouldLoadSearchResults,
  validateSearchRouteSearch,
} from "@/routes/helpers/search-route.helper";

export interface SearchViewProps {
  search: SearchRouteSearch;
}

export function SearchView({ search }: SearchViewProps) {
  const { q, type } = search;
  const navigate = useNavigate();
  const { t } = useLingui();
  const locale = useTmdbLocale();
  const isMobile = useIsMobile();
  const viewMode = useEffectiveViewMode(type);

  const [query, setQuery] = useState(q || "");
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);

  const isSearching = shouldLoadSearchResults(q);
  const hasFilters = hasActiveSearchFilters(search);

  useEffect(() => {
    setQuery(q || "");
  }, [q]);

  useEffect(() => {
    if (debouncedQuery === (q || "")) return;
    navigate({
      to: "/search",
      search: (prev) => {
        const current = clearSearchFilters({ ...validateSearchRouteSearch(prev), type });
        return { ...current, q: debouncedQuery, type };
      },
      replace: true,
      resetScroll: false,
    });
  }, [debouncedQuery, navigate, q, type]);

  const movieDiscoverOptions = useMemo(() => buildMovieDiscoverOptions(pickMovieSearchFilters(search)), [search]);
  const tvDiscoverOptions = useMemo(() => buildTvDiscoverOptions(pickTvSearchFilters(search)), [search]);

  const queryPlaceholder = keepPreviousData;

  const movieDiscoverQuery = useInfiniteQuery({
    ...movieQueries.discover(movieDiscoverOptions, locale),
    enabled: !isSearching && type === "movie",
    placeholderData: queryPlaceholder,
  });
  const tvDiscoverQuery = useInfiniteQuery({
    ...tvQueries.discover(tvDiscoverOptions, locale),
    enabled: !isSearching && type === "tv",
    placeholderData: queryPlaceholder,
  });
  const movieSearchQuery = useInfiniteQuery({
    ...movieQueries.search(q, locale),
    enabled: isSearching && type === "movie",
    placeholderData: queryPlaceholder,
  });
  const tvSearchQuery = useInfiniteQuery({
    ...tvQueries.search(q, locale),
    enabled: isSearching && type === "tv",
    placeholderData: queryPlaceholder,
  });

  const activeQuery = isSearching
    ? type === "movie"
      ? movieSearchQuery
      : tvSearchQuery
    : type === "movie"
      ? movieDiscoverQuery
      : tvDiscoverQuery;
  const results = flattenInfiniteResults(activeQuery);

  const handleTypeChange = (value: string) => {
    navigate({
      to: "/search",
      search: { ...search, type: value as SearchRouteType },
      replace: true,
    });
  };

  const handleMovieFiltersChange = (value: ReturnType<typeof pickMovieSearchFilters>) => {
    navigate({
      to: "/search",
      search: { ...clearSearchFilters(search), type: "movie", q: "", ...value },
      replace: true,
      resetScroll: false,
    });
    setQuery("");
  };

  const handleTvFiltersChange = (value: ReturnType<typeof pickTvSearchFilters>) => {
    navigate({
      to: "/search",
      search: { ...clearSearchFilters(search), type: "tv", q: "", ...value },
      replace: true,
      resetScroll: false,
    });
    setQuery("");
  };

  const placeholder = type === "tv" ? t`Search TV shows...` : t`Search movies...`;

  const showResultsSkeleton = activeQuery.isPending && results.length === 0;

  const resultsContent = showResultsSkeleton ? (
    viewMode === "grid" ? (
      <MediaGrid query={activeQuery} />
    ) : (
      <MediaTable query={activeQuery} />
    )
  ) : activeQuery.isError ? (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="mb-2 text-2xl font-bold">
        <Trans>Search failed</Trans>
      </h2>
      <p className="text-muted-foreground">
        <Trans>Could not reach the server. Try again in a moment.</Trans>
      </p>
    </div>
  ) : isSearching && results.length === 0 ? (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <SearchIcon className="mb-4 size-16 text-muted-foreground/20" />
      <h2 className="mb-2 text-2xl font-bold">
        <Trans>No results found for "{q}"</Trans>
      </h2>
      <p className="text-muted-foreground">
        <Trans>Try a different search term</Trans>
      </p>
    </div>
  ) : viewMode === "grid" ? (
    <>
      <MediaGrid items={results} query={activeQuery} />
      <InfiniteSentinel query={activeQuery} />
    </>
  ) : (
    <>
      <MediaTable media={results} query={activeQuery} />
      <InfiniteSentinel query={activeQuery} />
    </>
  );

  return (
    <Container className="sm:space-y-3">
      <div className="flex flex-row items-center justify-between gap-2">
        <Tabs value={type} onValueChange={handleTypeChange} className="min-w-0 flex-1">
          <TabsList size="lg" className="w-full sm:w-fit">
            <TabsTrigger value="movie" size="lg" className="flex-1 sm:flex-none">
              <FilmIcon className="size-4" />
              <Trans>Movies</Trans>
            </TabsTrigger>
            <TabsTrigger value="tv" size="lg" className="flex-1 sm:flex-none">
              <TvIcon className="size-4" />
              <Trans>TV Shows</Trans>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex shrink-0 items-center gap-2">
          {!isSearching &&
            (type === "movie" ? (
              <MovieFiltersSheet
                value={pickMovieSearchFilters(search)}
                onChange={handleMovieFiltersChange}
                triggerVariant="secondary"
              />
            ) : (
              <TvFiltersSheet
                value={pickTvSearchFilters(search)}
                onChange={handleTvFiltersChange}
                triggerVariant="secondary"
              />
            ))}
          <MediaTabsViewMode scope={type} />
        </div>
      </div>

      {!hasFilters && !isMobile && (
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input h="lg" placeholder={placeholder} value={query} search onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}

      {resultsContent}
    </Container>
  );
}
