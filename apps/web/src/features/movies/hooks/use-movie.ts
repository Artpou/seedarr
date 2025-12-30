import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { MovieQueryOptions } from "tmdb-ts";

import { api } from "@/lib/api";
import { useTMDB } from "@/shared/hooks/use-tmdb";

import { tmdbMovieToMedia } from "@/features/media/helpers/media.helper";
import { useMovieStore } from "@/features/movies/store/movie-store";

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
  const { movieGenres, setMovieGenres } = useMovieStore();

  return useQuery({
    queryKey: ["movie-genres", tmdbLocale],
    queryFn: async () => {
      if (movieGenres[tmdbLocale]) {
        return movieGenres[tmdbLocale];
      }

      const data = await tmdb.genres.movies({ language: tmdbLocale });
      setMovieGenres(tmdbLocale, data.genres);
      return data.genres;
    },
  });
}

export function useMovieProviders() {
  const { tmdb, tmdbLocale } = useTMDB();
  const { movieProviders, setMovieProviders } = useMovieStore();

  const NUMBER_OF_PROVIDERS = 5;

  return useQuery({
    queryKey: ["movie-providers", tmdbLocale],
    queryFn: async () => {
      if (movieProviders[tmdbLocale]) {
        return movieProviders[tmdbLocale].slice(0, NUMBER_OF_PROVIDERS);
      }

      const data = await tmdb.watchProviders.getMovieProviders();
      // Extract country code from locale (e.g., "fr-FR" -> "FR")
      const country = tmdbLocale.split("-")[1] || "US";

      const sortedProviders = data.results
        .filter(
          (provider: { logo_path: string; display_priorities: Record<string, number> }) =>
            provider.logo_path && provider.display_priorities?.[country],
        )
        .sort(
          (
            a: { display_priorities: Record<string, number> },
            b: { display_priorities: Record<string, number> },
          ) => a.display_priorities[country] - b.display_priorities[country],
        );

      // Deduplicate by provider_name (keeps first occurrence)
      const providerMap = new Map();
      for (const provider of sortedProviders) {
        if (!providerMap.has(provider.provider_name)) {
          providerMap.set(provider.provider_name, provider);
        }
      }

      const result = Array.from(providerMap.values()).map((provider) => {
        // don't need display_priorities for the UI
        provider.display_priorities = {} as typeof provider.display_priorities;
        return provider;
      });

      setMovieProviders(tmdbLocale, result);
      return result.slice(0, NUMBER_OF_PROVIDERS);
    },
  });
}
