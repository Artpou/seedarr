import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Download } from "@/modules/download/download.schema";
import fs from "node:fs/promises";
import path from "node:path";
import { getTvDownloadsFolder, listDownloadVideoSearchDirs, resolveDownloadLocalVideo } from "./paths.helper";

const { mediaRepository } = await import("@/modules/media/media.repository");

describe("download-local-video-path.helper", () => {
  let tmpRoot: string;
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(process.cwd(), "seedarr-video-path-"));
    for (const key of ["DOWNLOADS_PATH", "HARDLINK_PATH", "HARDLINK_MOVIE_PATH", "HARDLINK_TV_PATH"]) {
      envBackup[key] = process.env[key];
    }
    process.env.DOWNLOADS_PATH = path.join(tmpRoot, "downloads");
    await fs.mkdir(process.env.DOWNLOADS_PATH, { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("prefers library movie path when staging was removed", async () => {
    process.env.HARDLINK_PATH = path.join(tmpRoot, "lib");
    process.env.HARDLINK_MOVIE_PATH = "movies";
    const libDir = path.join(tmpRoot, "lib", "movies", "Dune (2021)");
    await fs.mkdir(libDir, { recursive: true });
    const videoPath = path.join(libDir, "dune.mkv");
    await fs.writeFile(videoPath, "video");

    const download = {
      id: "d1",
      mediaId: 42,
      torrent: { done: true, name: "Dune.2021.1080p" },
    } as unknown as Download;

    vi.spyOn(mediaRepository, "find").mockResolvedValue({
      id: 42,
      type: "movie",
      title: "Dune",
      release_date: "2021-01-01",
    } as never);

    const resolved = await resolveDownloadLocalVideo(download);
    expect(resolved?.filePath).toBe(videoPath);

    const dirs = await listDownloadVideoSearchDirs(download);
    expect(dirs[0]).toBe(libDir);
  });
});

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
