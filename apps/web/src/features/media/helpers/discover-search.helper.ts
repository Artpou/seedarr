import { parseNumber, parseString } from "@seedarr/shared";

import type { MovieFiltersValue } from "@/features/movies/components/movie-filters-sheet";
import type { TvFiltersValue } from "@/features/tv/components/tv-filters-sheet";

export type DiscoverTypeParam = "new" | "top_rated" | "top-rated";

type DiscoverSort = "vote_average.desc" | "popularity.desc";

type DiscoverQueryOptions = {
  sort_by?: DiscoverSort;
  with_genres?: string;
  with_watch_providers?: string;
  with_keywords?: string;
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;
  "vote_average.gte"?: number;
};

type SearchRecord = Record<string, unknown>;

export type MovieDiscoverSearch = MovieFiltersValue & {
  type?: DiscoverTypeParam;
  genre?: string;
};

export type TvDiscoverSearch = TvFiltersValue & {
  type?: DiscoverTypeParam;
  genre?: string;
};

export function parseDiscoverType(value: unknown): DiscoverTypeParam | undefined {
  if (value === "new" || value === "top_rated" || value === "top-rated" || value === "top rated") {
    return value === "top rated" ? "top_rated" : (value as DiscoverTypeParam);
  }
  return undefined;
}

export function isScopedDiscoverSearch(search: MovieDiscoverSearch | TvDiscoverSearch): boolean {
  return Boolean(search.type || search.genre);
}

function parseDiscoverFilters(search: SearchRecord) {
  return {
    with_watch_providers: parseString(search.with_watch_providers),
    with_keywords: parseString(search.with_keywords),
    with_keywords_label: parseString(search.with_keywords_label),
    with_runtime_gte: parseNumber(search.with_runtime_gte),
    with_runtime_lte: parseNumber(search.with_runtime_lte),
    vote_average_gte: parseNumber(search.vote_average_gte),
  };
}

export function validateMovieDiscoverSearch(search: SearchRecord): Partial<MovieDiscoverSearch> {
  const type = parseDiscoverType(search.type);
  const genre = parseString(search.genre);

  return {
    ...parseDiscoverFilters(search),
    type,
    genre,
    release_date_gte: parseString(search.release_date_gte),
    release_date_lte: parseString(search.release_date_lte),
  };
}

export function validateTvDiscoverSearch(search: SearchRecord): Partial<TvDiscoverSearch> {
  const type = parseDiscoverType(search.type);
  const genre = parseString(search.genre);

  return {
    ...parseDiscoverFilters(search),
    type,
    genre,
    first_air_date_gte: parseString(search.first_air_date_gte),
    first_air_date_lte: parseString(search.first_air_date_lte),
  };
}

export function buildMovieDiscoverOptions(search: Partial<MovieDiscoverSearch>): DiscoverQueryOptions & {
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
} {
  // Precedence rule: if both `type` and `genre` are present, `type` takes precedence over `genre`.
  const isTopRated = search.type === "top_rated" || search.type === "top-rated";
  const sortBy: DiscoverSort | undefined = isTopRated ? "vote_average.desc" : undefined;
  const withGenres = search.type ? undefined : search.genre;

  return {
    sort_by: sortBy,
    with_genres: withGenres,
    with_watch_providers: search.with_watch_providers,
    "primary_release_date.gte": search.release_date_gte,
    "primary_release_date.lte": search.release_date_lte,
    with_keywords: search.with_keywords,
    "with_runtime.gte": search.with_runtime_gte,
    "with_runtime.lte": search.with_runtime_lte,
    "vote_average.gte": search.vote_average_gte,
  };
}

export function buildTvDiscoverOptions(search: Partial<TvDiscoverSearch>): DiscoverQueryOptions & {
  "first_air_date.gte"?: string;
  "first_air_date.lte"?: string;
} {
  // Precedence rule: if both `type` and `genre` are present, `type` takes precedence over `genre`.
  const isTopRated = search.type === "top_rated" || search.type === "top-rated";
  const sortBy: DiscoverSort | undefined = isTopRated ? "vote_average.desc" : undefined;
  const withGenres = search.type ? undefined : search.genre;

  return {
    sort_by: sortBy,
    with_genres: withGenres,
    with_watch_providers: search.with_watch_providers,
    "first_air_date.gte": search.first_air_date_gte,
    "first_air_date.lte": search.first_air_date_lte,
    with_keywords: search.with_keywords,
    "with_runtime.gte": search.with_runtime_gte,
    "with_runtime.lte": search.with_runtime_lte,
    "vote_average.gte": search.vote_average_gte,
  };
}

export function pickMovieFilters(search: Partial<MovieDiscoverSearch>): MovieFiltersValue {
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

export function pickTvFilters(search: Partial<TvDiscoverSearch>): TvFiltersValue {
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
