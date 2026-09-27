import { describe, expect, it, vi } from "vitest";
import type WebTorrent from "webtorrent";

import {
  applyTorrentFilePolicy,
  buildAvailableEpisodesFromTorrent,
  mergeTvEpisodes,
  resolveWantedEpisodes,
} from "./download-tv-scope.helper";

function fakeTorrent(files: { name: string; path: string }[]) {
  return {
    files: files.map((f) => ({ ...f, length: 100, deselect: vi.fn(), select: vi.fn() })),
  } as unknown as WebTorrent.Torrent;
}

describe("download-tv-scope.helper", () => {
  it("builds available episodes from video file names", () => {
    const torrent = fakeTorrent([
      { name: "Show S01E01.mkv", path: "Show S01E01.mkv" },
      { name: "Show S01E02.mkv", path: "Show S01E02.mkv" },
      { name: "readme.txt", path: "readme.txt" },
    ]);
    expect(buildAvailableEpisodesFromTorrent(torrent)).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
  });

  it("resolves single episode or full season", () => {
    const available = [
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
      { season: 2, episode: 1 },
    ];
    expect(resolveWantedEpisodes(available, { mediaType: "tv", season: 1, episode: 2 })).toEqual([
      { season: 1, episode: 2 },
    ]);
    expect(resolveWantedEpisodes(available, { mediaType: "tv", season: 1, fullSeason: true })).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
    expect(resolveWantedEpisodes(available, { mediaType: "tv", season: 1 })).toBeNull();
    expect(resolveWantedEpisodes(available, { mediaType: "movie" })).toBeNull();
  });

  it("selects only wanted files when tvScope is set", () => {
    const torrent = fakeTorrent([
      { name: "Show S01E01.mkv", path: "Show S01E01.mkv" },
      { name: "Show S01E02.mkv", path: "Show S01E02.mkv" },
    ]);
    applyTorrentFilePolicy(torrent, {
      available: [
        { season: 1, episode: 1 },
        { season: 1, episode: 2 },
      ],
      wanted: [{ season: 1, episode: 1 }],
    });
    expect(torrent.files[0].select).toHaveBeenCalled();
    expect(torrent.files[1].select).not.toHaveBeenCalled();
  });

  it("merges wanted episodes without duplicates", () => {
    expect(
      mergeTvEpisodes(
        [{ season: 1, episode: 1 }],
        [
          { season: 1, episode: 2 },
          { season: 1, episode: 1 },
        ],
      ),
    ).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
  });
});
