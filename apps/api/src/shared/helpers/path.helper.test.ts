import { afterEach, describe, expect, it } from "vitest";

import path from "node:path";
import {
  assertWithinDownloads,
  collectDownloadDeletePaths,
  getDownloadFolderName,
  getDownloadsRoot,
  requireDownloadFolderName,
  resolveDownloadStagingPath,
  resolveTorrentStorePath,
  resolveWithinDownloads,
} from "./path.helper";

describe("path helper", () => {
  const originalDownloadsPath = process.env.DOWNLOADS_PATH;

  afterEach(() => {
    if (originalDownloadsPath === undefined) {
      delete process.env.DOWNLOADS_PATH;
    } else {
      process.env.DOWNLOADS_PATH = originalDownloadsPath;
    }
  });

  it("resolves paths within downloads root", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    expect(resolveWithinDownloads("Movie.2024", "video.mkv")).toBe(
      path.resolve("/downloads", "Movie.2024", "video.mkv"),
    );
  });

  it("rejects path traversal via torrent name", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    expect(() => resolveWithinDownloads("../../etc", "passwd")).toThrow(/escapes download directory/);
  });

  it("rejects path traversal via file segment", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    expect(() => resolveWithinDownloads("Movie.2024", "../../../etc/passwd")).toThrow(/escapes download directory/);
  });

  it("assertWithinDownloads accepts the root itself", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    expect(() => assertWithinDownloads(getDownloadsRoot())).not.toThrow();
  });

  it("getDownloadFolderName prefers torrent name", () => {
    expect(getDownloadFolderName({ torrent: { name: "Movie.2024" }, remoteLocation: "movies/Other" })).toBe(
      "Movie.2024",
    );
  });

  it("getDownloadFolderName falls back to remoteLocation basename", () => {
    expect(getDownloadFolderName({ torrent: null, remoteLocation: "movies/Movie.2024/" })).toBe("Movie.2024");
    expect(getDownloadFolderName({ torrent: { name: "  " }, remoteLocation: "tv/Show.S01" })).toBe("Show.S01");
  });

  it("getDownloadFolderName returns undefined when neither is set", () => {
    expect(getDownloadFolderName({ torrent: null, remoteLocation: null })).toBeUndefined();
    expect(getDownloadFolderName({})).toBeUndefined();
  });

  it("requireDownloadFolderName rejects empty names", () => {
    expect(() => requireDownloadFolderName({ torrent: null })).toThrow(/no folder name/);
    expect(() => requireDownloadFolderName({ torrent: { name: "   " } })).toThrow(/no folder name/);
    expect(requireDownloadFolderName({ torrent: { name: "Movie.2024" } })).toBe("Movie.2024");
  });

  it("resolveTorrentStorePath uses persisted torrent.path for TV show folder", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    const showDir = path.join("/downloads", "Breaking Bad (2008)");
    expect(
      resolveTorrentStorePath({
        torrent: { name: "Breaking Bad (2008)", path: showDir, files: [] },
      }),
    ).toBe(showDir);
    expect(resolveTorrentStorePath({ torrent: null })).toBe("/downloads");
  });

  it("resolveDownloadStagingPath resolves TV pack under show folder", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    const showDir = path.join("/downloads", "Breaking Bad (2008)");
    const pack = "Breaking Bad (2008) Season 1-5 S01-S05";
    expect(
      resolveDownloadStagingPath({
        torrent: {
          name: pack,
          path: showDir,
          files: [{ path: `${pack}/Season 1/S01E01.mkv` }],
        },
      }),
    ).toBe(path.join(showDir, pack));
  });

  it("collectDownloadDeletePaths includes pack folder and show staging root", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    const showDir = path.join("/downloads", "Breaking Bad (2008)");
    const pack = "Breaking.Bad.S01";
    const paths = collectDownloadDeletePaths({
      torrent: {
        name: "Breaking Bad (2008)",
        path: showDir,
        files: [{ path: `${pack}/S01E01.mkv` }],
      },
    });
    expect(paths).toContain(path.join(showDir, pack));
    expect(paths).toContain(showDir);
  });

  it("resolveDownloadStagingPath resolves flat movie folder", () => {
    process.env.DOWNLOADS_PATH = "/downloads";
    expect(
      resolveDownloadStagingPath({
        torrent: {
          name: "Movie.2024.1080p",
          path: "/downloads",
          files: [{ path: "Movie.2024.1080p/video.mkv" }],
        },
      }),
    ).toBe(path.join("/downloads", "Movie.2024.1080p"));
  });
});
