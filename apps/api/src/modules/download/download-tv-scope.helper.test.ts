import { describe, expect, it, vi } from "vitest";
import type WebTorrent from "webtorrent";

import {
  applyTorrentFilePolicy,
  assertTvScopeForRequest,
  buildAvailableEpisodesFromTorrent,
  guardTorrentPieceRequests,
  mergeTvEpisodes,
  resolveWantedEpisodes,
} from "./download-tv-scope.helper";

function fakeTorrent(
  files: { name: string; path: string; _startPiece?: number; _endPiece?: number }[],
  opts?: { pieceCount?: number },
) {
  const pieceCount = opts?.pieceCount ?? 10;
  return {
    ready: true,
    pieces: Array.from({ length: pieceCount }, () => ({})),
    deselect: vi.fn(),
    select: vi.fn(),
    files: files.map((f) => ({
      ...f,
      length: 100,
      deselect: vi.fn(),
      select: vi.fn(),
    })),
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
      { name: "Show S01E01.mkv", path: "Show S01E01.mkv", _startPiece: 0, _endPiece: 5 },
      { name: "Show S01E02.mkv", path: "Show S01E02.mkv", _startPiece: 5, _endPiece: 9 },
    ]);
    applyTorrentFilePolicy(torrent, {
      available: [
        { season: 1, episode: 1 },
        { season: 1, episode: 2 },
      ],
      wanted: [{ season: 1, episode: 1 }],
    });
    expect(torrent.deselect).toHaveBeenCalledWith(0, 9, 0);
    expect(torrent.files[0].deselect).toHaveBeenCalled();
    expect(torrent.files[1].deselect).toHaveBeenCalled();
    expect(torrent.select).toHaveBeenCalledWith(0, 5);
    expect(torrent.select).not.toHaveBeenCalledWith(5, 9);
    expect(torrent.files[1].select).not.toHaveBeenCalled();
  });

  it("assertTvScopeForRequest rejects TV episode download without matching scope", () => {
    expect(() =>
      assertTvScopeForRequest({ mediaType: "tv", season: 1, episode: 3 }, { available: [], wanted: [] }),
    ).toThrow(/No matching episode/);
  });

  it("leaves files deselected when wanted is empty unless selectAllIfEmpty", () => {
    const torrent = fakeTorrent([
      { name: "Show S01E01.mkv", path: "Show S01E01.mkv" },
      { name: "Show S01E02.mkv", path: "Show S01E02.mkv" },
    ]);
    applyTorrentFilePolicy(torrent, null);
    expect(torrent.files[0].deselect).toHaveBeenCalled();
    expect(torrent.files[1].deselect).toHaveBeenCalled();
    expect(torrent.files[0].select).not.toHaveBeenCalled();
    expect(torrent.files[1].select).not.toHaveBeenCalled();

    applyTorrentFilePolicy(torrent, null, { selectAllIfEmpty: true });
    expect(torrent.files[0].select).toHaveBeenCalled();
    expect(torrent.files[1].select).toHaveBeenCalled();
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

  it("guardTorrentPieceRequests blocks _request outside _selections (Allowed Fast leak)", () => {
    const originalRequest = vi.fn().mockReturnValue(true);
    const selections = {
      length: 1,
      get: (i: number) => (i === 0 ? { from: 0, to: 5 } : undefined),
    };
    const torrent = {
      ready: true,
      _selections: selections,
      _request: originalRequest,
      files: [],
      pieces: Array.from({ length: 20 }, () => ({})),
      deselect: vi.fn(),
      select: vi.fn(),
    } as unknown as WebTorrent.Torrent;

    guardTorrentPieceRequests(torrent);

    const guarded = (torrent as unknown as { _request: typeof originalRequest })._request;
    expect(guarded({}, 3, false)).toBe(true); // inside selection
    expect(originalRequest).toHaveBeenCalledWith({}, 3, false);

    originalRequest.mockClear();
    expect(guarded({}, 12, false)).toBe(false); // E04-like piece outside selection
    expect(originalRequest).not.toHaveBeenCalled();
  });

  it("guardTorrentPieceRequests is idempotent", () => {
    const originalRequest = vi.fn().mockReturnValue(true);
    const torrent = {
      _selections: { length: 0, get: () => undefined },
      _request: originalRequest,
    } as unknown as WebTorrent.Torrent;

    guardTorrentPieceRequests(torrent);
    const first = (torrent as unknown as { _request: unknown })._request;
    guardTorrentPieceRequests(torrent);
    const second = (torrent as unknown as { _request: unknown })._request;
    expect(first).toBe(second);
  });
});
