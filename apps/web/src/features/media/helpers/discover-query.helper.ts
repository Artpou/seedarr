import type { User } from "@seedarr/sdk";
import { hasMinRole } from "@seedarr/shared";
import type { QueryClient } from "@tanstack/react-query";

import {
  buildMovieDiscoverOptions,
  buildTvDiscoverOptions,
  isScopedDiscoverSearch,
  type MovieDiscoverSearch,
  type TvDiscoverSearch,
} from "@/features/media/helpers/discover-search.helper";
import { genreQueries } from "@/features/media/hooks/genre.queries";
import { mediaQueries } from "@/features/media/hooks/media.queries";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { requestQueries } from "@/features/request/hooks/request.queries";
import { tvQueries } from "@/features/tv/hooks/tv.queries";

export type DiscoverMediaType = "movie" | "tv";
export type DiscoverRouteSearch = MovieDiscoverSearch | TvDiscoverSearch;

/** Main infinite-query options for movies/tv discover when scoped (type or genre). */
export function getDiscoverMainQueryOptions(type: DiscoverMediaType, search: DiscoverRouteSearch, locale: string) {
  if (type === "movie") {
    return movieQueries.discover(buildMovieDiscoverOptions(search as MovieDiscoverSearch), locale);
  }
  return tvQueries.discover(buildTvDiscoverOptions(search as TvDiscoverSearch), locale);
}

type DiscoverLoaderContext = {
  queryClient: QueryClient;
  user?: User | null;
};

/** Prefetch for route loader. */
export function prefetchDiscoverRouteQueries(
  context: DiscoverLoaderContext,
  type: DiscoverMediaType,
  search: DiscoverRouteSearch,
  locale: string,
): Promise<unknown>[] {
  const prefetch: Promise<unknown>[] = [context.queryClient.ensureQueryData(mediaQueries.inProgress(type))];

  if (isScopedDiscoverSearch(search)) {
    if (type === "movie") {
      prefetch.push(
        context.queryClient.ensureInfiniteQueryData(
          movieQueries.discover(buildMovieDiscoverOptions(search as MovieDiscoverSearch), locale),
        ),
      );
    } else {
      prefetch.push(
        context.queryClient.ensureInfiniteQueryData(
          tvQueries.discover(buildTvDiscoverOptions(search as TvDiscoverSearch), locale),
        ),
      );
    }
  } else {
    // Carousels default discover page: prefetch New, Top Rated, and Genres
    if (type === "movie") {
      prefetch.push(
        context.queryClient.ensureInfiniteQueryData(movieQueries.discover({}, locale)),
        context.queryClient.ensureInfiniteQueryData(movieQueries.discover({ sort_by: "vote_average.desc" }, locale)),
      );
    } else {
      prefetch.push(
        context.queryClient.ensureInfiniteQueryData(tvQueries.discover({}, locale)),
        context.queryClient.ensureInfiniteQueryData(tvQueries.discover({ sort_by: "vote_average.desc" }, locale)),
      );
    }
    prefetch.push(context.queryClient.ensureQueryData(genreQueries.list(type, locale)));
  }

  if (hasMinRole(context.user?.role, "admin")) {
    prefetch.push(context.queryClient.ensureQueryData(requestQueries.byType(type)));
  }

  return prefetch;
}
