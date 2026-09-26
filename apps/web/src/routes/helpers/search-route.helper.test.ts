import { describe, expect, it } from "vitest";

import {
  parseSearchRouteType,
  shouldLoadSearchResults,
  validateSearchRouteSearch,
} from "@/routes/helpers/search-route.helper";

describe("search-route.helper", () => {
  it("parses type and validates search", () => {
    expect(parseSearchRouteType("movie")).toBe("movie");
    expect(parseSearchRouteType("tv")).toBe("tv");
    expect(parseSearchRouteType("nope")).toBe("movie");
    expect(validateSearchRouteSearch({ q: "dune", type: "tv" })).toEqual({ q: "dune", type: "tv" });
    expect(validateSearchRouteSearch({})).toEqual({ q: "", type: "movie" });
  });

  it("gates loading by query length", () => {
    expect(shouldLoadSearchResults("a")).toBe(false);
    expect(shouldLoadSearchResults("ab")).toBe(true);
  });
});
