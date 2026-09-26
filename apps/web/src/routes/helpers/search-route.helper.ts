import { parseNumber, parseString } from "@seedarr/shared";

import type { MovieFiltersValue } from "@/features/movies/components/movie-filters-sheet";
import type { TvFiltersValue } from "@/features/tv/components/tv-filters-sheet";

export type SearchRouteType = "movie" | "tv";

export type SearchRouteSearch = {
  q: string;
  type: SearchRouteType;
} & MovieFiltersValue &
  TvFiltersValue;

export function parseSearchRouteType(type: unknown): SearchRouteType {
  if (type === "tv") return "tv";
  return "movie";
}

function parseSharedDiscoverFilters(search: Record<string, unknown>) {
  return {
    with_watch_providers: parseString(search.with_watch_providers),
    with_keywords: parseString(search.with_keywords),
    with_keywords_label: parseString(search.with_keywords_label),
    with_runtime_gte: parseNumber(search.with_runtime_gte),
    with_runtime_lte: parseNumber(search.with_runtime_lte),
    vote_average_gte: parseNumber(search.vote_average_gte),
  };
}

export function validateSearchRouteSearch(search: Record<string, unknown>): SearchRouteSearch {
  const type = parseSearchRouteType(search.type);
  const shared = parseSharedDiscoverFilters(search);

  return {
    q: typeof search.q === "string" ? search.q : "",
    type,
    ...shared,
    release_date_gte: parseString(search.release_date_gte),
    release_date_lte: parseString(search.release_date_lte),
    first_air_date_gte: parseString(search.first_air_date_gte),
    first_air_date_lte: parseString(search.first_air_date_lte),
  };
}

export function shouldLoadSearchResults(query: string): boolean {
  return query.trim().length >= 2;
}

/** Loader deps — exclude `q` so typing does not re-run the route loader (focus + full-page pending). */
export function omitSearchQueryFromLoaderDeps<T extends { q?: string }>(search: T): Omit<T, "q"> {
  const { q: _q, ...rest } = search;
  return rest;
}

export function hasActiveSearchFilters(search: SearchRouteSearch): boolean {
  const {
    q: _q,
    type: _type,
    release_date_gte,
    release_date_lte,
    first_air_date_gte,
    first_air_date_lte,
    with_watch_providers,
    with_keywords,
    with_runtime_gte,
    with_runtime_lte,
    vote_average_gte,
  } = search;

  return Boolean(
    release_date_gte ||
      release_date_lte ||
      first_air_date_gte ||
      first_air_date_lte ||
      with_watch_providers ||
      with_keywords ||
      with_runtime_gte != null ||
      with_runtime_lte != null ||
      vote_average_gte != null,
  );
}

export function pickMovieSearchFilters(search: SearchRouteSearch): MovieFiltersValue {
  const {
    release_date_gte,
    release_date_lte,
    with_watch_providers,
    with_keywords,
    with_keywords_label,
    with_runtime_gte,
    with_runtime_lte,
    vote_average_gte,
  } = search;

  return {
    release_date_gte,
    release_date_lte,
    with_watch_providers,
    with_keywords,
    with_keywords_label,
    with_runtime_gte,
    with_runtime_lte,
    vote_average_gte,
  };
}

export function pickTvSearchFilters(search: SearchRouteSearch): TvFiltersValue {
  const {
    first_air_date_gte,
    first_air_date_lte,
    with_watch_providers,
    with_keywords,
    with_keywords_label,
    with_runtime_gte,
    with_runtime_lte,
    vote_average_gte,
  } = search;

  return {
    first_air_date_gte,
    first_air_date_lte,
    with_watch_providers,
    with_keywords,
    with_keywords_label,
    with_runtime_gte,
    with_runtime_lte,
    vote_average_gte,
  };
}

export function clearSearchFilters(search: SearchRouteSearch): SearchRouteSearch {
  return {
    q: search.q,
    type: search.type,
  };
}
