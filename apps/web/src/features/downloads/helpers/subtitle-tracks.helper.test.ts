import { describe, expect, it, vi } from "vitest";

import { buildSubtitleTracks, resolveSubtitleTracksToBlobs } from "./subtitle-tracks.helper";

describe("subtitle-tracks.helper", () => {
  it("builds tracks from torrent files and external paths", () => {
    const download = {
      id: "dl-1",
      torrent: {
        files: [
          { name: "Movie.mkv", path: "Movie.mkv", length: 100 },
          { name: "Movie.en.srt", path: "Movie.en.srt", length: 1 },
        ],
      },
    } as never;

    const tracks = buildSubtitleTracks(download, ["Movie/Movie.fr.srt"]);
    expect(tracks.length).toBeGreaterThanOrEqual(2);
    expect(tracks[0].src).toContain("/streaming/dl-1/subtitles/");
    expect(tracks.some((t) => t.default)).toBe(true);
  });

  it("includes torrent subtitles in the same folder as the video without matching basename", () => {
    const download = {
      id: "dl-1",
      torrent: {
        files: [
          { name: "American.Psycho.2000.mp4", path: "Release/American.Psycho.2000.mp4", length: 100 },
          { name: "Release.en.srt", path: "Release/Release.en.srt", length: 1 },
        ],
      },
    } as never;

    const tracks = buildSubtitleTracks(download, []);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.src).toContain("Release.en.srt");
  });

  it("strips downloads/ prefix from torrent paths in track URLs", () => {
    const download = {
      id: "dl-1",
      torrent: {
        files: [
          {
            name: "American.Psycho.mp4",
            path: "downloads/Release/American.Psycho.mp4",
            length: 100,
          },
          { name: "Release.en.srt", path: "downloads/Release/Release.en.srt", length: 1 },
        ],
      },
    } as never;

    const tracks = buildSubtitleTracks(download, []);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.src).toContain(encodeURIComponent("Release/Release.en.srt"));
    expect(tracks[0]?.src).not.toContain("downloads");
  });

  it("prefers blob URLs after successful prefetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "1\n00:00:01,000 --> 00:00:02,000\nHi\n",
      }),
    );
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => "blob:track-1"),
      }),
    );

    const result = await resolveSubtitleTracksToBlobs([
      {
        kind: "subtitles",
        label: "English",
        srclang: "en",
        src: "/streaming/dl-1/subtitles/a.srt",
        default: true,
        format: "vtt",
      },
    ]);

    expect(result.tracks[0].src).toBe("blob:track-1");
    expect(result.blobUrls).toEqual(["blob:track-1"]);
    vi.unstubAllGlobals();
  });
});
