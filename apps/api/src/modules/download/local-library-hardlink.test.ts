import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const { findMedia } = vi.hoisted(() => ({
  findMedia: vi.fn(),
}));

vi.mock("@/modules/download/download.repository", () => ({
  downloadRepository: {
    find: vi.fn().mockResolvedValue({ mediaId: 42, torrent: { name: "Movie.2021.mkv" } }),
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

const { tryLocalLibraryHardlink, resolveLibraryBase } = await import("./local-library-hardlink");

describe("local-library-hardlink", () => {
  let tmpRoot: string;
  let prev: Record<string, string | undefined>;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "seedarr-hl-"));
    prev = {
      HARDLINK_PATH: process.env.HARDLINK_PATH,
      HARDLINK_MOVIE_PATH: process.env.HARDLINK_MOVIE_PATH,
      HARDLINK_TV_PATH: process.env.HARDLINK_TV_PATH,
      DOWNLOADS_PATH: process.env.DOWNLOADS_PATH,
    };
    delete process.env.HARDLINK_MOVIE_PATH;
    delete process.env.HARDLINK_TV_PATH;
    delete process.env.HARDLINK_PATH;
    process.env.DOWNLOADS_PATH = tmpRoot;
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
    await expect(tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv")).resolves.toBeUndefined();
  });

  it("refuses paths containing ..", async () => {
    process.env.HARDLINK_PATH = `${tmpRoot}/lib`;
    process.env.HARDLINK_MOVIE_PATH = "../escape";
    const src = path.join(tmpRoot, "Movie.2021.mkv");
    await fs.writeFile(src, "x");
    await expect(tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv")).rejects.toThrow(/Unsafe|\.\./i);
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

  it("falls back to copyFile only on EXDEV", async () => {
    const lib = path.join(tmpRoot, "library");
    process.env.HARDLINK_PATH = lib;
    const src = path.join(tmpRoot, "Movie.2021.mkv");
    await fs.writeFile(src, "copied");

    const linkSpy = vi
      .spyOn(fs, "link")
      .mockRejectedValueOnce(Object.assign(new Error("cross-device"), { code: "EXDEV" }));
    const copySpy = vi.spyOn(fs, "copyFile");

    await tryLocalLibraryHardlink("dl-1", "Movie.2021.mkv");

    expect(linkSpy).toHaveBeenCalled();
    expect(copySpy).toHaveBeenCalled();
    linkSpy.mockRestore();
    copySpy.mockRestore();
  });
});
