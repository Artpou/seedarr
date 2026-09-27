import { describe, expect, it } from "vitest";

import { getTvDownloadsFolder } from "./download-staging-path.helper";

describe("download-staging-path.helper", () => {
  it("builds Show (year) without season folder", () => {
    const folder = getTvDownloadsFolder(
      { type: "tv", title: "The Simpsons", release_date: "1989-12-17" },
      "Simpsons.S01E03.1989.1080p-Dual-Lat",
    );
    expect(folder).toBe("The Simpsons (1989)");
  });

  it("returns null for movies", () => {
    expect(
      getTvDownloadsFolder({ type: "movie", title: "Dune", release_date: "2021-01-01" }, "Dune.2021.1080p"),
    ).toBeNull();
  });
});
