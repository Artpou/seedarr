import { describe, expect, it } from "vitest";

import {
  buildMovieDiscoverOptions,
  parseDiscoverType,
  validateMovieDiscoverSearch,
} from "@/features/media/helpers/discover-search.helper";

describe("/movies validateSearch", () => {
  it("parses valid discover search params", () => {
    expect(
      validateMovieDiscoverSearch({
        type: "top_rated",
        genre: "28",
        with_watch_providers: "8",
        release_date_gte: "2020-01-01",
        with_runtime_gte: 60,
        vote_average_gte: 7,
      }),
    ).toEqual({
      type: "top_rated",
      genre: "28",
      with_watch_providers: "8",
      release_date_gte: "2020-01-01",
      release_date_lte: undefined,
      with_keywords: undefined,
      with_keywords_label: undefined,
      with_runtime_gte: 60,
      with_runtime_lte: undefined,
      vote_average_gte: 7,
    });
  });

  it("handles type parsing", () => {
    expect(parseDiscoverType("new")).toBe("new");
    expect(parseDiscoverType("top_rated")).toBe("top_rated");
    expect(parseDiscoverType("invalid")).toBeUndefined();
  });

  it("maps top_rated to vote sort", () => {
    expect(buildMovieDiscoverOptions({ type: "top_rated" })).toMatchObject({
      sort_by: "vote_average.desc",
    });
  });

  it("prefers type over genre when both are specified", () => {
    expect(buildMovieDiscoverOptions({ type: "top_rated", genre: "28" })).toMatchObject({
      sort_by: "vote_average.desc",
      with_genres: undefined,
    });
  });
});
