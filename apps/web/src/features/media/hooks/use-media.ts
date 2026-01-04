import type { Media } from "@basement/api/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MultiSearchResult } from "tmdb-ts";

import { api, unwrap } from "@/lib/api";
import { useTMDB } from "@/shared/hooks/use-tmdb";

import {
  FMDBResult,
  fmdbResultToMedia,
  tmdbMovieToMedia,
  tmdbTVToMedia,
} from "@/features/media/helpers/media.helper";

export function useMedia(id: number) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: () => unwrap(api.media[":id"].$get({ param: { id: id.toString() } })),
  });
}

export function useRecentlyViewed(type: "movie" | "tv" | undefined, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["recently-viewed", type],
    queryFn: ({ pageParam = 1 }) =>
      unwrap(
        api.media["recently-viewed"].$get({
          query: { type, page: pageParam.toString(), limit: limit.toString() },
        }),
      ),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useLikeMedia(type: "movie" | "tv" | undefined, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["like-media", type],
    queryFn: ({ pageParam = 1 }) =>
      unwrap(
        api.media.like.$get({
          query: { type, page: pageParam.toString(), limit: limit.toString() },
        }),
      ),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useWatchListMedia(type: "movie" | "tv" | undefined, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["watch-list-media", type],
    queryFn: ({ pageParam = 1 }) =>
      unwrap(
        api.media["watch-list"].$get({
          query: { type, page: pageParam.toString(), limit: limit.toString() },
        }),
      ),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useMediaStatus(mediaId: number) {
  return useQuery({
    queryKey: ["media-status", mediaId],
    queryFn: () =>
      unwrap(
        api.media[":id"].status.$get({
          param: { id: mediaId.toString() },
        }),
      ),
  });
}

export function useMediaStatusBatch(mediaIds: number[]) {
  return useQuery({
    queryKey: ["media-status-batch", ...mediaIds.sort()],
    queryFn: () =>
      unwrap<Record<number, { isLiked: boolean; isInWatchList: boolean }>>(
        api.media.status.batch.$post({ json: { mediaIds } }),
      ),
    enabled: mediaIds.length > 0,
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (media: Media) => unwrap(api.media.like.$post({ json: media })),
    onSuccess: (_, media) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["media-status", media.id] });
      queryClient.invalidateQueries({ queryKey: ["media-status-batch"] });
      queryClient.invalidateQueries({ queryKey: ["like-media"] });
    },
  });
}

export function useToggleWatchList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (media: Media) => unwrap(api.media["watch-list"].$post({ json: media })),
    onSuccess: (_, media) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["media-status", media.id] });
      queryClient.invalidateQueries({ queryKey: ["media-status-batch"] });
      queryClient.invalidateQueries({ queryKey: ["watch-list-media"] });
    },
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
