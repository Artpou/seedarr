import { describe, expect, it } from "vitest";

import {
  buildMovieDiscoverOptions,
  buildTvDiscoverOptions,
  isScopedDiscoverSearch,
  parseDiscoverType,
  pickMovieFilters,
  pickTvFilters,
  validateMovieDiscoverSearch,
  validateTvDiscoverSearch,
} from "./discover-search.helper";

describe("discover-search.helper", () => {
  it("validates discover search params", () => {
    expect(parseDiscoverType("new")).toBe("new");
    expect(parseDiscoverType("popular")).toBe("popular");
    expect(parseDiscoverType("top_rated")).toBe("top_rated");
    expect(parseDiscoverType("top-rated")).toBe("top-rated");
    expect(parseDiscoverType("top rated")).toBe("top_rated");
    expect(parseDiscoverType("unknown")).toBeUndefined();

    expect(isScopedDiscoverSearch({})).toBe(false);
    expect(isScopedDiscoverSearch({ type: "popular" })).toBe(true);
    expect(isScopedDiscoverSearch({ genre: "28" })).toBe(true);
    expect(isScopedDiscoverSearch({ lang: "fr" })).toBe(true);

    const movieLang = buildMovieDiscoverOptions({ lang: "ja" });
    expect(movieLang.sort_by).toBe("popularity.desc");
    expect(movieLang.with_original_language).toBe("ja");

    expect(validateMovieDiscoverSearch({ type: "top_rated", genre: "28" })).toMatchObject({
      type: "top_rated",
      genre: "28",
    });
    expect(validateTvDiscoverSearch({ genre: "10759", first_air_date_gte: "2020-01-01" })).toMatchObject({
      genre: "10759",
      first_air_date_gte: "2020-01-01",
    });
  });

  it("builds discover options and respects type precedence over genre", () => {
    // When type=top_rated and genre are both present, type takes precedence (genre is ignored)
    const movieWithBoth = buildMovieDiscoverOptions({ type: "top_rated", genre: "28" });
    expect(movieWithBoth.sort_by).toBe("vote_average.desc");
    expect(movieWithBoth.with_genres).toBeUndefined();

    // When type=popular and genre are both present, type takes precedence
    const moviePopularWithGenre = buildMovieDiscoverOptions({ type: "popular", genre: "28" });
    expect(moviePopularWithGenre.sort_by).toBe("popularity.desc");
    expect(moviePopularWithGenre.with_release_type).toBe("4|5");
    expect(moviePopularWithGenre.with_genres).toBeUndefined();

    const movieNewWithGenre = buildMovieDiscoverOptions({ type: "new", genre: "28" });
    expect(movieNewWithGenre.sort_by).toBe("popularity.desc");
    expect(movieNewWithGenre.with_release_type).toBe("2|3");
    expect(movieNewWithGenre["release_date.gte"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(movieNewWithGenre["release_date.lte"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // When only genre is present, with_genres is set
    const movieGenreOnly = buildMovieDiscoverOptions({ genre: "28" });
    expect(movieGenreOnly.with_genres).toBe("28");

    // TV options
    const tv = buildTvDiscoverOptions({ type: "top_rated", vote_average_gte: 7 });
    expect(tv.sort_by).toBe("vote_average.desc");
    expect(tv["vote_average.gte"]).toBe(7);
  });

  it("picks filter subsets", () => {
    expect(pickMovieFilters({ release_date_gte: "2020-01-01", vote_average_gte: 8 })).toEqual({
      release_date_gte: "2020-01-01",
      release_date_lte: undefined,
      with_watch_providers: undefined,
      with_keywords: undefined,
      with_keywords_label: undefined,
      with_runtime_gte: undefined,
      with_runtime_lte: undefined,
      vote_average_gte: 8,
    });
    expect(pickTvFilters({ first_air_date_lte: "2021-01-01" }).first_air_date_lte).toBe("2021-01-01");
  });
});
