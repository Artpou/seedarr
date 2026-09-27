import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const { findMedia, findDownload } = vi.hoisted(() => ({
  findMedia: vi.fn(),
  findDownload: vi.fn(),
}));

vi.mock("@/modules/download/download.repository", () => ({
  downloadRepository: {
    find: findDownload,
  },
}));

vi.mock("@/modules/media/media.repository", () => ({
  mediaRepository: {
    find: findMedia,
  },
}));

vi.mock("@/shared/helpers/logger.helper", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const {
  tryLocalLibraryHardlink,
  runLocalLibraryHardlink,
  resolveLibraryBase,
  isHardlinkRemoveSourceEnabled,
  hasHardlinkSuccess,
  clearHardlinkSuccess,
  handleTorrentUnloaded,
  removeHardlinkStaging,
} = await import("./local-library-hardlink");

describe("local-library-hardlink", () => {
  let tmpRoot: string;
  let prev: Record<string, string | undefined>;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "seedarr-hl-"));
    prev = {
      HARDLINK_PATH: process.env.HARDLINK_PATH,
      HARDLINK_MOVIE_PATH: process.env.HARDLINK_MOVIE_PATH,
      HARDLINK_TV_PATH: process.env.HARDLINK_TV_PATH,
      HARDLINK_REMOVE_SOURCE: process.env.HARDLINK_REMOVE_SOURCE,
      DOWNLOADS_PATH: process.env.DOWNLOADS_PATH,
    };
    delete process.env.HARDLINK_MOVIE_PATH;
    delete process.env.HARDLINK_TV_PATH;
    delete process.env.HARDLINK_PATH;
    delete process.env.HARDLINK_REMOVE_SOURCE;
    clearHardlinkSuccess("dl-1");
    process.env.DOWNLOADS_PATH = tmpRoot;
    findDownload.mockReset().mockResolvedValue({ mediaId: 42, torrent: { name: "Movie.2021.mkv" } });
    findMedia.mockReset().mockResolvedValue({
      id: 42,
      type: "movie",
      title: "Dune",
      release_date: "2021-01-01",
    });
  });

  afterEach(async () => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("resolveLibraryBase: root only → root", () => {
    process.env.HARDLINK_PATH = "/media";
    expect(resolveLibraryBase("movie")).toBe(path.resolve("/media"));
    expect(resolveLibraryBase("tv")).toBe(path.resolve("/media"));
  });

  it("resolveLibraryBase: relative movie under root", () => {
    process.env.HARDLINK_PATH = "/media";
    process.env.HARDLINK_MOVIE_PATH = "movies";
    expect(resolveLibraryBase("movie")).toBe(path.resolve("/media/movies"));
    expect(resolveLibraryBase("tv")).toBe(path.resolve("/media"));
  });

  it("resolveLibraryBase: absolute typed path without root", () => {
    process.env.HARDLINK_MOVIE_PATH = "/data/movies";
    expect(resolveLibraryBase("movie")).toBe(path.resolve("/data/movies"));
    expect(resolveLibraryBase("tv")).toBeNull();
  });

  it("skips when nothing configured", async () => {
    await expect(tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv")).resolves.toBe(false);
  });

  it("refuses paths containing ..", async () => {
    process.env.HARDLINK_PATH = `${tmpRoot}/lib`;
    process.env.HARDLINK_MOVIE_PATH = "../escape";
    const src = path.join(tmpRoot, "Movie.2021.mkv");
    await fs.writeFile(src, "x");
    await expect(tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv")).rejects.toThrow(/Unsafe|\.\./i);
  });

  it("prefers DB folder name over stale .mkv hint after wrap", async () => {
    const lib = path.join(tmpRoot, "library");
    process.env.HARDLINK_PATH = lib;
    const folder = path.join(tmpRoot, "Zootopie");
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, "Zootopie.mkv"), "hello");
    findDownload.mockResolvedValue({ mediaId: 42, torrent: { name: "Zootopie" } });
    findMedia.mockResolvedValue({
      id: 42,
      type: "movie",
      title: "Zootopia",
      release_date: "2016-01-01",
    });

    await tryLocalLibraryHardlink("dl-1", "Zootopie.mkv");

    const dest = path.join(lib, "Zootopia (2016)", "Zootopie.mkv");
    expect(await fs.readFile(dest, "utf8")).toBe("hello");
  });

  it("hardlinks under root when no movie path", async () => {
    const lib = path.join(tmpRoot, "library");
    process.env.HARDLINK_PATH = lib;
    const src = path.join(tmpRoot, "Movie.2021.mkv");
    await fs.writeFile(src, "hello");

    await tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv");

    const dest = path.join(lib, "Dune (2021)", "Movie.2021.mkv");
    expect(await fs.readFile(dest, "utf8")).toBe("hello");
    const [a, b] = await Promise.all([fs.stat(src), fs.stat(dest)]);
    expect(a.ino).toBe(b.ino);
  });

  it("hardlinks under relative movie subdir", async () => {
    const lib = path.join(tmpRoot, "library");
    process.env.HARDLINK_PATH = lib;
    process.env.HARDLINK_MOVIE_PATH = "movies";
    const src = path.join(tmpRoot, "Movie.2021.mkv");
    await fs.writeFile(src, "hello");

    await tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv");

    const dest = path.join(lib, "movies", "Dune (2021)", "Movie.2021.mkv");
    expect(await fs.readFile(dest, "utf8")).toBe("hello");
  });

  it("falls back to copyFile only on EXDEV and returns false", async () => {
    const lib = path.join(tmpRoot, "library");
    process.env.HARDLINK_PATH = lib;
    const src = path.join(tmpRoot, "Movie.2021.mkv");
    await fs.writeFile(src, "copied");

    const linkSpy = vi
      .spyOn(fs, "link")
      .mockRejectedValueOnce(Object.assign(new Error("cross-device"), { code: "EXDEV" }));
    const copySpy = vi.spyOn(fs, "copyFile");

    const result = await tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv");
    expect(result).toBe(false);

    expect(linkSpy).toHaveBeenCalled();
    expect(copySpy).toHaveBeenCalled();
    linkSpy.mockRestore();
    copySpy.mockRestore();
  });

  describe("HARDLINK_REMOVE_SOURCE", () => {
    it("isHardlinkRemoveSourceEnabled: off by default", () => {
      expect(isHardlinkRemoveSourceEnabled()).toBe(false);
      process.env.HARDLINK_REMOVE_SOURCE = "false";
      expect(isHardlinkRemoveSourceEnabled()).toBe(false);
      process.env.HARDLINK_REMOVE_SOURCE = "0";
      expect(isHardlinkRemoveSourceEnabled()).toBe(false);
    });

    it("isHardlinkRemoveSourceEnabled: recognizes true / 1", () => {
      process.env.HARDLINK_REMOVE_SOURCE = "true";
      expect(isHardlinkRemoveSourceEnabled()).toBe(true);
      process.env.HARDLINK_REMOVE_SOURCE = " 1 ";
      expect(isHardlinkRemoveSourceEnabled()).toBe(true);
      process.env.HARDLINK_REMOVE_SOURCE = "TRUE";
      expect(isHardlinkRemoveSourceEnabled()).toBe(true);
    });

    it("off by default: source is kept even after unload", async () => {
      const lib = path.join(tmpRoot, "library");
      process.env.HARDLINK_PATH = lib;
      const src = path.join(tmpRoot, "Movie.2021.mkv");
      await fs.writeFile(src, "content");

      await runLocalLibraryHardlink("dl-1", "Movie.2021.mkv");
      expect(hasHardlinkSuccess("dl-1")).toBe(true);

      // Unload happens
      await handleTorrentUnloaded("dl-1", "Movie.2021.mkv");

      // Source still exists because HARDLINK_REMOVE_SOURCE is off
      expect(await fs.readFile(src, "utf8")).toBe("content");
    });

    it("on + link OK: source kept before unload, deleted after unload", async () => {
      process.env.HARDLINK_REMOVE_SOURCE = "1";
      const lib = path.join(tmpRoot, "library");
      process.env.HARDLINK_PATH = lib;
      const src = path.join(tmpRoot, "Movie.2021.mkv");
      await fs.writeFile(src, "content");

      await runLocalLibraryHardlink("dl-1", "Movie.2021.mkv");
      expect(hasHardlinkSuccess("dl-1")).toBe(true);

      // Option is ON, but unload has NOT happened yet -> source still present
      expect(await fs.readFile(src, "utf8")).toBe("content");

      // Destination in library is present
      const dest = path.join(lib, "Dune (2021)", "Movie.2021.mkv");
      expect(await fs.readFile(dest, "utf8")).toBe("content");

      // Unload triggered
      await handleTorrentUnloaded("dl-1", "Movie.2021.mkv");

      // Source is now removed
      await expect(fs.stat(src)).rejects.toThrow(/ENOENT/);
      // Library destination is still there
      expect(await fs.readFile(dest, "utf8")).toBe("content");
      // Flag cleared
      expect(hasHardlinkSuccess("dl-1")).toBe(false);
    });

    it("on + EXDEV copy fallback: source is KEPT even after unload", async () => {
      process.env.HARDLINK_REMOVE_SOURCE = "true";
      const lib = path.join(tmpRoot, "library");
      process.env.HARDLINK_PATH = lib;
      const src = path.join(tmpRoot, "Movie.2021.mkv");
      await fs.writeFile(src, "copied-content");

      const linkSpy = vi
        .spyOn(fs, "link")
        .mockRejectedValueOnce(Object.assign(new Error("cross-device"), { code: "EXDEV" }));
      const copySpy = vi.spyOn(fs, "copyFile");

      await runLocalLibraryHardlink("dl-1", "Movie.2021.mkv");
      expect(hasHardlinkSuccess("dl-1")).toBe(false);

      // Unload triggered
      await handleTorrentUnloaded("dl-1", "Movie.2021.mkv");

      // Source must be KEPT because it was not a true hardlink
      expect(await fs.readFile(src, "utf8")).toBe("copied-content");

      linkSpy.mockRestore();
      copySpy.mockRestore();
    });

    it("removeHardlinkStaging logs warning and does not crash if path fails", async () => {
      findDownload.mockResolvedValueOnce(null);
      await expect(removeHardlinkStaging("dl-missing")).resolves.toBeUndefined();
    });
  });
});
