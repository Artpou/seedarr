import { parseNumber, parseString } from "@seedarr/shared";

import type { LibraryFiltersValue } from "@/features/media/components/sheet/media-sheet-filter-library";

export type ProfileRouteSearch = LibraryFiltersValue & {
  q?: string;
};

export function validateProfileSearch(search: Record<string, unknown>): ProfileRouteSearch {
  const q = parseString(search.q);
  const with_genres = parseString(search.with_genres);
  const release_date_gte = parseString(search.release_date_gte);
  const release_date_lte = parseString(search.release_date_lte);
  const with_runtime_gte = parseNumber(search.with_runtime_gte);
  const with_runtime_lte = parseNumber(search.with_runtime_lte);
  const vote_average_gte = parseNumber(search.vote_average_gte);

  return {
    ...(q !== undefined ? { q } : {}),
    ...(with_genres !== undefined ? { with_genres } : {}),
    ...(release_date_gte !== undefined ? { release_date_gte } : {}),
    ...(release_date_lte !== undefined ? { release_date_lte } : {}),
    ...(with_runtime_gte !== undefined ? { with_runtime_gte } : {}),
    ...(with_runtime_lte !== undefined ? { with_runtime_lte } : {}),
    ...(vote_average_gte !== undefined ? { vote_average_gte } : {}),
  };
}

export function pickProfileLibraryFilters(search: ProfileRouteSearch): LibraryFiltersValue {
  return {
    with_genres: search.with_genres,
    release_date_gte: search.release_date_gte,
    release_date_lte: search.release_date_lte,
    with_runtime_gte: search.with_runtime_gte,
    with_runtime_lte: search.with_runtime_lte,
    vote_average_gte: search.vote_average_gte,
  };
}

const OWN_PROFILE_SUFFIXES = ["", "/", "/likes", "/watch-list", "/history"] as const;

export function isOwnProfileTopbarPath(pathname: string, userId: string): boolean {
  const base = `/user/${userId}`;
  return OWN_PROFILE_SUFFIXES.some((suffix) => pathname === `${base}${suffix}`);
}
