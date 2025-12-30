import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { MovieQueryOptions } from "tmdb-ts";

import { api } from "@/lib/api";
import { useTMDB } from "@/shared/hooks/use-tmdb";

import { tmdbMovieToMedia } from "@/features/media/helpers/media.helper";

export function useMovieDetails(id: string) {
  const { tmdb, tmdbLocale } = useTMDB();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["movie-full", id, tmdbLocale],
    queryFn: async () => {
      // Single request with all data
      const movieData = await tmdb.movies.details(Number(id), [
        "watch/providers",
        "videos",
        "credits",
        "recommendations",
        "external_ids",
      ]);

      // Track the movie view
      await api.media.track.post({
        type: "movie",
        ...movieData,
        id: Number(id),
        title: movieData.title || movieData.original_title,
        poster_path: movieData.poster_path ?? null,
      });

      // Invalidate recently-viewed cache after tracking
      queryClient.invalidateQueries({ queryKey: ["recently-viewed"] });

      // Fetch collection if exists
      let collection = null;
      if (movieData.belongs_to_collection?.id) {
        collection = await tmdb.collections.details(movieData.belongs_to_collection.id);
      }

      return { movie: movieData, collection };
    },
  });
}

export function useMovieDiscover(options: MovieQueryOptions = {}) {
  const { tmdb, tmdbLocale } = useTMDB();

  return useInfiniteQuery({
    queryKey: ["movie-discover", tmdbLocale, JSON.stringify(options)],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await tmdb.discover.movie({ ...options, page: pageParam });
      return {
        results: data.results.map(tmdbMovieToMedia),
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

export function useMovieGenres() {
  const { tmdb, tmdbLocale } = useTMDB();

  return useQuery({
    queryKey: ["movie-genres", tmdbLocale],
    queryFn: async () => {
      const data = await tmdb.genres.movies({ language: tmdbLocale });
      return data.genres;
    },
  });
}
