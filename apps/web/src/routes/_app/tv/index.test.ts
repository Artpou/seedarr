import { describe, expect, it } from "vitest";

import { buildTvDiscoverOptions, validateTvDiscoverSearch } from "@/features/media/helpers/discover-search.helper";

describe("/tv validateSearch", () => {
  it("parses TV-specific date filters", () => {
    expect(
      validateTvDiscoverSearch({
        type: "top_rated",
        genre: "10759",
        first_air_date_gte: "2024-06-01",
        first_air_date_lte: "2024-12-31",
      }),
    ).toMatchObject({
      type: "top_rated",
      genre: "10759",
      first_air_date_gte: "2024-06-01",
      first_air_date_lte: "2024-12-31",
    });
  });

  it("maps top_rated tab to vote sort", () => {
    expect(buildTvDiscoverOptions({ type: "top_rated" })).toMatchObject({
      sort_by: "vote_average.desc",
    });
  });

  it("prefers type over genre when both are specified", () => {
    expect(buildTvDiscoverOptions({ type: "top_rated", genre: "10759" })).toMatchObject({
      sort_by: "vote_average.desc",
      with_genres: undefined,
    });
  });
});
