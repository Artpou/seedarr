import { describe, expect, it } from "vitest";

import {
  parseSearchRouteType,
  shouldLoadSearchResults,
  validateSearchRouteSearch,
} from "@/routes/helpers/search-route.helper";

describe("/search validateSearch", () => {
  it("normalizes query and type", () => {
    expect(validateSearchRouteSearch({ q: "matrix", type: "tv" })).toEqual({ q: "matrix", type: "tv" });
    expect(validateSearchRouteSearch({ q: "matrix", type: "movie" })).toEqual({ q: "matrix", type: "movie" });
  });

  it("defaults missing query to empty string and type to movie", () => {
    expect(validateSearchRouteSearch({})).toEqual({ q: "", type: "movie" });
    expect(validateSearchRouteSearch({ q: 123, type: "invalid" })).toEqual({ q: "", type: "movie" });
  });
});

describe("parseSearchRouteType", () => {
  it("accepts movie and tv", () => {
    expect(parseSearchRouteType("movie")).toBe("movie");
    expect(parseSearchRouteType("tv")).toBe("tv");
    expect(parseSearchRouteType("all")).toBe("movie");
    expect(parseSearchRouteType("other")).toBe("movie");
  });
});

describe("/search loader", () => {
  it("gates search results when query is too short", () => {
    expect(shouldLoadSearchResults("")).toBe(false);
    expect(shouldLoadSearchResults("a")).toBe(false);
    expect(shouldLoadSearchResults("  x ")).toBe(false);
  });

  it("loads search results when query is long enough", () => {
    expect(shouldLoadSearchResults("ab")).toBe(true);
    expect(shouldLoadSearchResults("matrix")).toBe(true);
  });
});
