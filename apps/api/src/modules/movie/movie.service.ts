import { MovieDetails, MultiSearchResult, Search, TMDB } from "tmdb-ts";
import { parseImdbMovieResponse, parseJustWatchResponse } from "@/modules/movie/movie.parser";

const UNLOGGED_URL = "https://imdb.iamidiotareyoutoo.com";

export class MovieService {
  async getMovie(id: string, apiKey: string | null = null): Promise<MovieDetails | null> {
    if (!apiKey) {
      // Ensure we don't double the 'tt' prefix if it's already there
      const cleanId = id.startsWith("tt") ? id : `tt${id}`;
      return await fetch(`${UNLOGGED_URL}/search?tt=${cleanId}`)
        .then((res) => res.json())
        .then((data) => parseImdbMovieResponse(data));
    }

    const tmdb = await new TMDB(apiKey);
    return await tmdb.movies.details(Number(id));
  }

  async getWatchProviders(id: string, apiKey: string | null = null) {
    if (!apiKey) return null;

    const tmdb = await new TMDB(apiKey);
    return await tmdb.movies.watchProviders(Number(id));
  }

  async search(query: string, apiKey: string | null): Promise<Search<MultiSearchResult>> {
    if (!apiKey) {
      return await fetch(`${UNLOGGED_URL}/justwatch?q=${query}&L=fr_FR`)
        .then((res) => res.json())
        .then((data) => parseJustWatchResponse(data));
    }

    const tmdb = await new TMDB(apiKey);
    return await tmdb.search.multi({ query });
  }
}

export const movieService = new MovieService();
