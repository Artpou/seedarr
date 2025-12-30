import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TvShowQueryOptions } from "tmdb-ts";

import { useTMDB } from "@/shared/hooks/use-tmdb";

import { tmdbTVToMedia } from "@/features/media/helpers/media.helper";

export function useTVDiscover(options: TvShowQueryOptions = {}) {
  const { tmdb, tmdbLocale } = useTMDB();

  return useInfiniteQuery({
    queryKey: ["tv-discover", tmdbLocale, JSON.stringify(options)],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await tmdb.discover.tvShow({ ...options, page: pageParam });
      return {
        results: data.results.map(tmdbTVToMedia),
        page: data.page,
        totalPages: data.total_pages,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useTVGenres() {
  const { tmdb, tmdbLocale } = useTMDB();

  return useQuery({
    queryKey: ["tv-genres", tmdbLocale],
    queryFn: async () => {
      const data = await tmdb.genres.tvShows({ language: tmdbLocale });
      return data.genres;
    },
  });
}
