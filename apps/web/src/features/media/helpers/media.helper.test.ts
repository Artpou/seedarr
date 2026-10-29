import { describe, expect, it } from "vitest";

import {
  getBackdropUrl,
  getMediaCardLinkOptions,
  getMediaType,
  getPosterUrl,
  getRemainingTime,
  getWatchProgressPercent,
  hasActiveDownload,
  hasWatchProgress,
  isActiveDownload,
  isMediaWatched,
  sortDownloadedLibraryCarousel,
} from "./media.helper";

describe("media.helper", () => {
  it("builds poster and backdrop URLs", () => {
    expect(getPosterUrl(null)).toBe("");
    expect(getPosterUrl("/abc.jpg", "w500")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(getPosterUrl("https://cdn/x.jpg")).toBe("https://cdn/x.jpg");
    expect(getBackdropUrl(undefined)).toBeUndefined();
    expect(getBackdropUrl("/bg.jpg", "w780")).toBe("https://image.tmdb.org/t/p/w780/bg.jpg");
  });

  it("normalizes media types", () => {
    expect(getMediaType("movie")).toBe("movie");
    expect(getMediaType("tv")).toBe("tv");
    expect(getMediaType("other")).toBeUndefined();
    expect(getMediaType(1)).toBeUndefined();
  });

  it("links downloaded media to play and preserves tv mode", () => {
    const movie = { id: 1, type: "movie", download: { id: "dl-1" } } as never;
    expect(getMediaCardLinkOptions(movie)).toEqual({ to: "/downloads/$id/play", params: { id: "dl-1" } });
    expect(getMediaCardLinkOptions(movie, { tvMode: true })).toEqual({
      to: "/downloads/$id/play",
      params: { id: "dl-1" },
      search: { mode: "tv" },
    });
    expect(getMediaCardLinkOptions({ id: 2, type: "tv" } as never)).toEqual({
      to: "/tv/$id",
      params: { id: "2" },
    });
  });

  it("computes watch progress helpers", () => {
    expect(getWatchProgressPercent({ progress: null } as never)).toBe(0);
    expect(getWatchProgressPercent({ progress: { position: 50, duration: 100 } } as never)).toBe(50);
    expect(hasWatchProgress({ progress: { position: 10, duration: 100 } } as never)).toBe(true);
    expect(hasWatchProgress({ progress: { position: 96, duration: 100 } } as never)).toBe(false);
    expect(isMediaWatched({ progress: { position: 10, duration: 100, completed: true } })).toBe(true);
    expect(isMediaWatched({ progress: { position: 95, duration: 100 } })).toBe(true);
    expect(isMediaWatched({ progress: { position: 10, duration: 100 } })).toBe(false);
    expect(isMediaWatched({})).toBe(false);
  });

  it("formats remaining time", () => {
    expect(getRemainingTime({ progress: { position: 0, duration: 0 } } as never)).toBeNull();
    expect(getRemainingTime({ progress: { position: 0, duration: 125 } } as never)).toMatch(/3 minutes/);
    expect(getRemainingTime({ progress: { position: 0, duration: 3700 } } as never)).toMatch(/1h/);
    expect(getRemainingTime({ duration: 90 } as never)).toMatch(/1h30/);
  });

  it("detects active downloads", () => {
    expect(isActiveDownload(undefined)).toBe(false);
    expect(isActiveDownload({ torrent: { transferring: true } } as never)).toBe(true);
    expect(isActiveDownload({ torrent: { done: false, paused: false } } as never)).toBe(true);
    expect(isActiveDownload({ torrent: { done: true, paused: false } } as never)).toBe(false);
    expect(
      hasActiveDownload({
        pages: [{ results: [{ download: { torrent: { done: false, paused: false } } }] }],
        pageParams: [],
      } as never),
    ).toBe(true);
  });

  it("sorts started watching before idle downloads", () => {
    const started = { id: 2, progress: { position: 120, duration: 3600 }, download: { torrent: { done: true } } };
    const idle = {
      id: 1,
      progress: { position: 0, duration: 0 },
      download: { torrent: { done: false, paused: true } },
    };
    const sorted = sortDownloadedLibraryCarousel([idle, started] as never);
    expect(sorted.map((m) => m.id)).toEqual([2, 1]);
  });
});
