import { parseNumber, parseString } from "@seedarr/shared";

import type { MovieFiltersValue } from "@/features/movies/components/movie-filters-sheet";
import type { TvFiltersValue } from "@/features/tv/components/tv-filters-sheet";

export type DiscoverTypeParam = "popular" | "new" | "top_rated" | "top-rated";

type DiscoverSort = "vote_average.desc" | "popularity.desc";

type DiscoverQueryOptions = {
  sort_by?: DiscoverSort;
  with_genres?: string;
  with_release_type?: string;
  with_original_language?: string;
  with_watch_providers?: string;
  with_keywords?: string;
  "release_date.gte"?: string;
  "release_date.lte"?: string;
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;
  "vote_average.gte"?: number;
};

type SearchRecord = Record<string, unknown>;

export type MovieDiscoverSearch = MovieFiltersValue & {
  type?: DiscoverTypeParam;
  genre?: string;
  /** ISO 639-1 TMDB `original_language` (scoped discover carousel). */
  lang?: string;
};

export type TvDiscoverSearch = TvFiltersValue & {
  type?: DiscoverTypeParam;
  genre?: string;
  lang?: string;
};

export function parseDiscoverType(value: unknown): DiscoverTypeParam | undefined {
  if (value === "popular" || value === "new") return value;
  if (value === "top_rated" || value === "top-rated" || value === "top rated") {
    return value === "top rated" ? "top_rated" : (value as DiscoverTypeParam);
  }
  return undefined;
}

/** TMDB: 4 = digital, 5 = physical (DVD / Blu-ray). */
const MOVIE_POPULAR_RELEASE_TYPE = "4|5";
/** TMDB: 2 = limited theatrical, 3 = theatrical. */
const MOVIE_NEW_RELEASE_TYPE = "2|3";
const MOVIE_NEW_MAX_AGE_DAYS = 14;

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Theatrical releases in the last {@link MOVIE_NEW_MAX_AGE_DAYS} days (uses TMDB `release_date.*` with `with_release_type`). */
function movieNewReleaseDateWindow(reference = new Date()): { gte: string; lte: string } {
  const lte = toIsoDate(reference);
  const from = new Date(reference);
  from.setDate(from.getDate() - MOVIE_NEW_MAX_AGE_DAYS);
  return { gte: toIsoDate(from), lte };
}

function movieNewDiscoverBase(): DiscoverQueryOptions {
  const { gte, lte } = movieNewReleaseDateWindow();
  return {
    sort_by: "popularity.desc",
    with_release_type: MOVIE_NEW_RELEASE_TYPE,
    "release_date.gte": gte,
    "release_date.lte": lte,
  };
}

/** Home carousel + scoped `type=popular`. Movies: digital / physical home release. */
export function popularDiscoverQueryOptions(mediaType: "movie" | "tv"): DiscoverQueryOptions {
  if (mediaType === "movie") {
    return { sort_by: "popularity.desc", with_release_type: MOVIE_POPULAR_RELEASE_TYPE };
  }
  return { sort_by: "popularity.desc" };
}

/** Home carousel + scoped `type=new`. Movies: theatrical releases in the last 2 weeks. */
export function newDiscoverQueryOptions(mediaType: "movie" | "tv"): DiscoverQueryOptions | null {
  if (mediaType !== "movie") return null;
  return movieNewDiscoverBase();
}

/** Home carousel when a discover language is configured in settings. */
export function languageDiscoverQueryOptions(languageCode: string): DiscoverQueryOptions {
  return { sort_by: "popularity.desc", with_original_language: languageCode };
}

export function isScopedDiscoverSearch(search: MovieDiscoverSearch | TvDiscoverSearch): boolean {
  return Boolean(search.type || search.genre || search.lang);
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
    lang: parseString(search.lang)?.toLowerCase(),
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
    lang: parseString(search.lang)?.toLowerCase(),
    first_air_date_gte: parseString(search.first_air_date_gte),
    first_air_date_lte: parseString(search.first_air_date_lte),
  };
}

function discoverSortForSearch(search: {
  type?: DiscoverTypeParam;
  genre?: string;
  lang?: string;
}): DiscoverSort | undefined {
  const isPopular = search.type === "popular";
  const isNew = search.type === "new";
  const isTopRated = search.type === "top_rated" || search.type === "top-rated";
  if (isTopRated) return "vote_average.desc";
  if (isPopular || isNew) return "popularity.desc";
  if (search.lang && !search.type) return "popularity.desc";
  return undefined;
}

export function buildMovieDiscoverOptions(search: Partial<MovieDiscoverSearch>): DiscoverQueryOptions & {
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "release_date.gte"?: string;
  "release_date.lte"?: string;
} {
  // Precedence rule: if both `type` and `genre` are present, `type` takes precedence over `genre`.
  const isPopular = search.type === "popular";
  const isNew = search.type === "new";
  const sortBy = discoverSortForSearch(search);
  const withGenres = search.type ? undefined : search.genre;
  const releaseType = isPopular ? MOVIE_POPULAR_RELEASE_TYPE : isNew ? MOVIE_NEW_RELEASE_TYPE : undefined;
  const newWindow = isNew ? movieNewReleaseDateWindow() : null;

  return {
    sort_by: sortBy,
    with_genres: withGenres,
    with_release_type: releaseType,
    with_original_language: search.lang,
    with_watch_providers: search.with_watch_providers,
    "release_date.gte": newWindow?.gte,
    "release_date.lte": newWindow?.lte,
    "primary_release_date.gte": isNew ? undefined : search.release_date_gte,
    "primary_release_date.lte": isNew ? undefined : search.release_date_lte,
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
  const sortBy = discoverSortForSearch(search);
  const withGenres = search.type ? undefined : search.genre;

  return {
    sort_by: sortBy,
    with_genres: withGenres,
    with_original_language: search.lang,
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
