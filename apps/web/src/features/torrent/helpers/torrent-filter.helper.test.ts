import type { Resolution } from "@seedarr/contracts";
import { describe, expect, it } from "vitest";

import {
  torrentMatchesLanguageFilter,
  torrentMatchesQualityFilter,
} from "@/features/torrent/helpers/torrent-filter.helper";

const Q720 = "720P" as Resolution;

describe("torrent-filter.helper", () => {
  it("combines language and quality with AND semantics", () => {
    const fr720 = { languages: ["fr", "en"], resolution: "720P" };
    const fr1080 = { languages: ["fr"], resolution: "1080P" };
    const en720 = { languages: ["en"], resolution: "720p" };

    expect(torrentMatchesLanguageFilter(fr720.languages, "fr")).toBe(true);
    expect(torrentMatchesQualityFilter(fr720.resolution, Q720)).toBe(true);

    expect(torrentMatchesLanguageFilter(fr1080.languages, "fr")).toBe(true);
    expect(torrentMatchesQualityFilter(fr1080.resolution, Q720)).toBe(false);

    expect(torrentMatchesLanguageFilter(en720.languages, "fr")).toBe(false);
    expect(torrentMatchesQualityFilter(en720.resolution, Q720)).toBe(true);
  });

  it("does not treat quality as minimum threshold", () => {
    expect(torrentMatchesQualityFilter("1080P", Q720)).toBe(false);
    expect(torrentMatchesQualityFilter("720P", Q720)).toBe(true);
  });

  it("matches language tags by ISO code, not display string", () => {
    expect(torrentMatchesLanguageFilter(["English"], "French")).toBe(false);
    expect(torrentMatchesLanguageFilter(["French", "English"], "French")).toBe(true);
    expect(torrentMatchesLanguageFilter(["English", "French"], "French")).toBe(true);
  });
});
