import { Genre, WatchProvider } from "tmdb-ts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MovieStore {
  movieProviders: Record<string, WatchProvider[]>;
  movieGenres: Record<string, Genre[]>;
  setMovieProviders: (locale: string, providers: WatchProvider[]) => void;
  setMovieGenres: (locale: string, genres: Genre[]) => void;
}

export const useMovieStore = create<MovieStore>()(
  persist(
    (set) => ({
      movieProviders: {},
      movieGenres: {},
      setMovieProviders: (locale, providers) =>
        set((state) => ({
          movieProviders: { ...state.movieProviders, [locale]: providers },
        })),
      setMovieGenres: (locale, genres) =>
        set((state) => ({
          movieGenres: { ...state.movieGenres, [locale]: genres },
        })),
    }),
    {
      name: "movie-store",
    },
  ),
);
