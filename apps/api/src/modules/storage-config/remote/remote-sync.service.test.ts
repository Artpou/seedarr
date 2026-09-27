import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { download } from "@/modules/download/download.schema";
import { media } from "@/modules/media/media.schema";
import { module } from "@/modules/module/module.schema";
import { createTestDb, sampleTorrent, seedTestUser, testDbRef } from "@/tests/test.helper";

const {
  getTmdbApiKey,
  listDirectories,
  listFiles,
  ensureDirectory,
  moveFile,
  syncPathExists,
  fetchTmdbById,
  fetchTmdbByImdbId,
  searchTmdbByTitle,
  tmdbItemToMediaInsert,
} = vi.hoisted(() => ({
  getTmdbApiKey: vi.fn(),
  listDirectories: vi.fn(),
  listFiles: vi.fn(),
  ensureDirectory: vi.fn(),
  moveFile: vi.fn(),
  syncPathExists: vi.fn(),
  fetchTmdbById: vi.fn(),
  fetchTmdbByImdbId: vi.fn(),
  searchTmdbByTitle: vi.fn(),
  tmdbItemToMediaInsert: vi.fn(),
}));

vi.mock("@/modules/tmdb/tmdb-key.query", () => ({
  getTmdbApiKey,
}));

const syncRoots = {
  moviePath: "movies",
  tvPath: "tv",
  storageModuleId: null,
  local: false,
};

const getSyncRoots = vi.fn().mockResolvedValue(syncRoots);

vi.mock("./remote-storage.service", () => ({
  remoteStorageService: {
    getSyncRoots,
    normalizeSyncRoot: (_roots: unknown, basePath: string) => basePath.replace(/\/+$/, ""),
    joinSyncPath: (_roots: unknown, base: string, name: string) => `${base}/${name}`,
    resolveOrganizedPath: (_roots: unknown, _base: string, organized: string) => organized,
    listSyncChildren: (_roots: unknown, base: string) => listDirectories(base),
    syncPathExists: (_roots: unknown, location: string) => syncPathExists(location),
    organizeSyncFile: async (_roots: unknown, from: string, targetDir: string, fileName: string) => {
      await ensureDirectory(targetDir);
      await moveFile(from, `${targetDir}/${fileName}`);
    },
    sumSyncVideoBytes: vi.fn().mockResolvedValue(12),
    listDirectories,
    listFiles,
    ensureDirectory,
    moveFile,
  },
}));

vi.mock("@/modules/tmdb/tmdb-resolve.helper", () => ({
  fetchTmdbById,
  fetchTmdbByImdbId,
  searchTmdbByTitle,
  sleep: vi.fn().mockResolvedValue(undefined),
  tmdbItemToMediaInsert,
}));

const { runManualSync, runRemoteSync } = await import("./remote-sync.service");

describe("remote-sync.service", () => {
  const user = { id: "user-1", username: "u", role: "admin" as const, createdAt: new Date() };

  beforeEach(() => {
    testDbRef.current = createTestDb();
    seedTestUser(testDbRef.current, user);
    getTmdbApiKey.mockReset().mockResolvedValue("tmdb-key");
    listDirectories.mockReset().mockResolvedValue([]);
    listFiles.mockReset().mockResolvedValue([{ name: "a.mkv", path: "a.mkv", length: 12 }]);
    ensureDirectory.mockReset().mockResolvedValue(undefined);
    moveFile.mockReset().mockResolvedValue(undefined);
    syncPathExists.mockReset().mockResolvedValue(true);
    fetchTmdbById.mockReset();
    fetchTmdbByImdbId.mockReset();
    searchTmdbByTitle.mockReset();
    tmdbItemToMediaInsert.mockReset().mockImplementation((item: { id: number; title?: string }, type: string) => ({
      id: item.id,
      type,
      title: item.title ?? "Title",
      imdbId: "tt0000001",
    }));
    getSyncRoots.mockReset().mockResolvedValue(syncRoots);
  });

  function seedStorage(enabled = true) {
    testDbRef.current
      .insert(module)
      .values({
        id: "cfg",
        type: "ftp",
        category: "storage",
        enabled,
        config: {
          host: "nas",
          port: 21,
          secure: false,
          moviePath: "movies",
          tvPath: "tv",
          autoTransfer: false,
          deleteLocalAfterTransfer: false,
        },
        updatedAt: new Date(),
      })
      .run();
  }

  it("runRemoteSync requires TMDB key", async () => {
    getTmdbApiKey.mockResolvedValue(null);
    await expect(runRemoteSync(user.id)).rejects.toThrow(/TMDB API key/);
  });

  it("runRemoteSync syncs directories matched by {tmdb-id}", async () => {
    seedStorage(true);
    listDirectories.mockImplementation(async (base: string) => {
      if (base === "movies") {
        return [{ name: "Dune {tmdb-123}", path: "Dune {tmdb-123}", type: "directory" }];
      }
      return [];
    });
    fetchTmdbById.mockResolvedValue({
      id: 123,
      title: "Dune",
      release_date: "2021-01-01",
    });

    const result = await runRemoteSync(user.id);
    expect(result.synced).toBe(1);
    expect(result.errors).toEqual([]);

    const dl = await testDbRef.current.query.download.findFirst();
    expect(dl?.remoteLocation).toContain("Dune");
    expect(dl?.mediaId).toBe(123);
  });

  it("runRemoteSync skips already imported remote locations", async () => {
    seedStorage(true);
    testDbRef.current.insert(media).values({ id: 1, type: "movie", title: "Old", imdbId: "tt1" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-existing",
        userId: user.id,
        mediaId: 1,
        remoteLocation: "movies/Dune {tmdb-123}",
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    listDirectories.mockImplementation(async (base: string) => {
      if (base === "movies") {
        return [{ name: "Dune {tmdb-123}", path: "Dune {tmdb-123}", type: "directory" }];
      }
      return [];
    });
    fetchTmdbById.mockResolvedValue({ id: 123, title: "Dune", release_date: "2021-01-01" });

    const result = await runRemoteSync(user.id);
    expect(result.skipped).toBeGreaterThanOrEqual(1);
    expect(result.synced).toBe(0);
  });

  it("runRemoteSync links nested Title (year) folders when torrent has no remoteLocation", async () => {
    // Hardlink layout: Movies/Dune (2021)/file.mkv — download exists from torrent but library path not linked yet.
    getSyncRoots.mockResolvedValue({
      moviePath: "/library/Movies",
      tvPath: "/library/Series",
      storageModuleId: null,
      local: true,
    });
    testDbRef.current.insert(media).values({ id: 123, type: "movie", title: "Dune", imdbId: "tt1160419" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-torrent",
        userId: user.id,
        mediaId: 123,
        remoteLocation: null,
        torrent: sampleTorrent({ name: "Dune.2021.1080p", done: true }),
        createdAt: new Date(),
      })
      .run();

    listDirectories.mockImplementation(async (base: string) => {
      if (base === "/library/Movies") {
        return [{ name: "Dune (2021)", path: "/library/Movies/Dune (2021)", type: "directory" }];
      }
      return [];
    });
    searchTmdbByTitle.mockResolvedValue({
      id: 123,
      title: "Dune",
      release_date: "2021-01-01",
    });

    const result = await runRemoteSync(user.id);
    expect(result.synced).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);

    const dl = await testDbRef.current.query.download.findFirst({ where: eq(download.id, "dl-torrent") });
    expect(dl?.remoteLocation).toBe("/library/Movies/Dune (2021)");
  });

  it("runManualSync creates download for TMDB media", async () => {
    fetchTmdbById.mockResolvedValue({ id: 55, title: "Manual Film", release_date: "2020-01-01" });

    await expect(
      runManualSync(user.id, { mediaId: 55, type: "movie", remotePath: "movies/Manual.mkv" }),
    ).resolves.toEqual({ success: true });

    const row = await testDbRef.current.query.download.findFirst({ where: eq(download.mediaId, 55) });
    expect(row?.mediaId).toBe(55);
    expect(row?.remoteLocation).toBe("movies/Manual Film (2020)");
    expect(moveFile).toHaveBeenCalled();
  });

  it("runManualSync is idempotent for same remote path", async () => {
    fetchTmdbById.mockResolvedValue({ id: 55, title: "Manual Film", release_date: "2020-01-01" });
    await runManualSync(user.id, { mediaId: 55, type: "movie", remotePath: "movies/Manual.mkv" });
    await runManualSync(user.id, { mediaId: 55, type: "movie", remotePath: "movies/Manual.mkv" });

    const rows = await testDbRef.current.query.download.findMany();
    expect(rows).toHaveLength(1);
  });
  it("runRemoteSync deletes orphan download when remoteLocation path is missing", async () => {
    seedStorage(true);
    testDbRef.current.insert(media).values({ id: 9, type: "movie", title: "Gone", imdbId: "tt9" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-orphan",
        userId: user.id,
        mediaId: 9,
        remoteLocation: "movies/Gone (2019)",
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    syncPathExists.mockImplementation(async (location: string) => location !== "movies/Gone (2019)");
    listDirectories.mockResolvedValue([]);

    await runRemoteSync(user.id);

    const row = await testDbRef.current.query.download.findFirst({ where: eq(download.id, "dl-orphan") });
    expect(row).toBeUndefined();
  });

  it("runRemoteSync does not delete torrent download without remoteLocation", async () => {
    getSyncRoots.mockResolvedValue({
      moviePath: "/library/Movies",
      tvPath: "/library/Series",
      storageModuleId: null,
      local: true,
    });
    testDbRef.current.insert(media).values({ id: 42, type: "movie", title: "Active", imdbId: "tt42" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-active",
        userId: user.id,
        mediaId: 42,
        remoteLocation: null,
        torrent: sampleTorrent({ name: "Active.2020", done: false, paused: true }),
        createdAt: new Date(),
      })
      .run();

    listDirectories.mockResolvedValue([]);
    syncPathExists.mockResolvedValue(false);

    await runRemoteSync(user.id);

    const row = await testDbRef.current.query.download.findFirst({ where: eq(download.id, "dl-active") });
    expect(row).toBeDefined();
    expect(row?.remoteLocation).toBeNull();
  });

  it("runRemoteSync keeps download when remoteLocation path still exists", async () => {
    seedStorage(true);
    testDbRef.current.insert(media).values({ id: 7, type: "movie", title: "Kept", imdbId: "tt7" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-kept",
        userId: user.id,
        mediaId: 7,
        remoteLocation: "movies/Kept (2020)",
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    listDirectories.mockImplementation(async (base: string) => {
      if (base === "movies") {
        return [{ name: "Kept (2020)", path: "Kept (2020)", type: "directory" }];
      }
      return [];
    });
    syncPathExists.mockResolvedValue(true);
    searchTmdbByTitle.mockResolvedValue({ id: 7, title: "Kept", release_date: "2020-01-01" });

    await runRemoteSync(user.id);

    const row = await testDbRef.current.query.download.findFirst({ where: eq(download.id, "dl-kept") });
    expect(row).toBeDefined();
    expect(row?.remoteLocation).toBe("movies/Kept (2020)");
  });
});
