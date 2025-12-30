import { useQuery } from "@tanstack/react-query";
import { TvShowQueryOptions } from "tmdb-ts";

import { useTMDB } from "@/shared/hooks/use-tmdb";

import { tmdbTVToMedia } from "@/features/media/helpers/media.helper";

export function useTVDiscover(options: TvShowQueryOptions = {}) {
  const { tmdb, tmdbLocale } = useTMDB();

  return useQuery({
    queryKey: ["tv-discover", tmdbLocale, JSON.stringify(options)],
    queryFn: async () => {
      const data = await tmdb.discover.tvShow(options);
      return data.results.map(tmdbTVToMedia);
    },
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
