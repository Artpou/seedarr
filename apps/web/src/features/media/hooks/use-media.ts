import { useQuery } from "@tanstack/react-query";
import type { MultiSearchResult } from "tmdb-ts";

import { api } from "@/lib/api";
import { useTMDB } from "@/shared/hooks/use-tmdb";

import {
  FMDBResult,
  fmdbResultToMedia,
  tmdbMovieToMedia,
  tmdbTVToMedia,
} from "@/features/media/helpers/media.helper";
import { Media } from "@/features/media/media";

export function useMedia(id: number) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: async () => {
      // biome-ignore lint/suspicious/noTsIgnore: Eden treaty doesn't properly type dynamic routes
      // @ts-ignore - bun type-check not working for /:id route at root level
      const response = await api.media({ id }).get();
      return response.data;
    },
  });
}

export function useRecentlyViewed(type: Media["type"], limit = 20) {
  return useQuery({
    queryKey: ["recently-viewed", type],
    queryFn: async () => {
      const response = await api.media["recently-viewed"].get({
        query: { type, limit },
      });
      return response.data || [];
    },
    refetchOnMount: "always",
  });
}

export function useMediaSearch(query: string) {
  const { tmdb, tmdbLocale } = useTMDB();

  return useQuery({
    queryKey: ["media-search", query, tmdbLocale],
    queryFn: async () => {
      const searchResults = await tmdb.search.multi({ query, language: tmdbLocale });

      // Transform results to Media type, filtering for movies and TV shows only
      const mediaResults: Media[] = [];

      for (const result of searchResults.results) {
        if (result.media_type === "movie") {
          const movie = result as Extract<MultiSearchResult, { media_type: "movie" }>;
          mediaResults.push(tmdbMovieToMedia(movie));
        } else if (result.media_type === "tv") {
          const tv = result as Extract<MultiSearchResult, { media_type: "tv" }>;
          mediaResults.push(tmdbTVToMedia(tv));
        }
      }

      const FMDB_URL = "https://imdb.iamidiotareyoutoo.com/";

      if (mediaResults.length === 0) {
        const fmdbData = await fetch(`${FMDB_URL}/justwatch?q=${query}`);
        const fmdbResult = await fmdbData.json();
        mediaResults.push(
          ...fmdbResult.description.map((result: FMDBResult) => fmdbResultToMedia(result)),
        );
      }

      return mediaResults;
    },
    enabled: query.length > 0,
  });
}
