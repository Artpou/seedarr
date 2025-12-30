import type { Genre, WatchProvider } from "tmdb-ts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TVStore {
  tvProviders: Record<string, WatchProvider[]>;
  tvGenres: Record<string, Genre[]>;
  setTVProviders: (locale: string, providers: WatchProvider[]) => void;
  setTVGenres: (locale: string, genres: Genre[]) => void;
}

export const useTVStore = create<TVStore>()(
  persist(
    (set) => ({
      tvProviders: {},
      tvGenres: {},
      setTVProviders: (locale, providers) =>
        set((state) => ({
          tvProviders: { ...state.tvProviders, [locale]: providers },
        })),
      setTVGenres: (locale, genres) =>
        set((state) => ({
          tvGenres: { ...state.tvGenres, [locale]: genres },
        })),
    }),
    {
      name: "tv-store",
    },
  ),
);
