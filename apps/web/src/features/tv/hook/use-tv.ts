import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TvShowQueryOptions } from "tmdb-ts";

import { useTMDB } from "@/shared/hooks/use-tmdb";

import { tmdbTVToMedia } from "@/features/media/helpers/media.helper";
import { useTVStore } from "@/features/tv/store/tv-store";

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
  const { tvGenres, setTVGenres } = useTVStore();

  return useQuery({
    queryKey: ["tv-genres", tmdbLocale],
    queryFn: async () => {
      // Check if genres exist in store for this locale
      if (tvGenres[tmdbLocale]) {
        return tvGenres[tmdbLocale];
      }

      // Fetch from API and store
      const data = await tmdb.genres.tvShows({ language: tmdbLocale });
      setTVGenres(tmdbLocale, data.genres);
      return data.genres;
    },
  });
}

export function useTVProviders() {
  const { tmdb, tmdbLocale } = useTMDB();
  const { tvProviders, setTVProviders } = useTVStore();

  const NUMBER_OF_PROVIDERS = 5;

  return useQuery({
    queryKey: ["tv-providers", tmdbLocale],
    queryFn: async () => {
      if (tvProviders[tmdbLocale]) {
        return tvProviders[tmdbLocale].slice(0, NUMBER_OF_PROVIDERS);
      }

      const data = await tmdb.watchProviders.getTvProviders();
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

      setTVProviders(tmdbLocale, result);
      return result.slice(0, NUMBER_OF_PROVIDERS);
    },
  });
}
