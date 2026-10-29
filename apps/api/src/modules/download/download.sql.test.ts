import { beforeEach, describe, expect, it } from "vitest";

import { downloadRepository } from "@/modules/download/download.repository";
import { download } from "@/modules/download/download.schema";
import { media } from "@/modules/media/media.schema";
import { module } from "@/modules/module/module.schema";
import { createTestDb, seedTestUser, testDbRef } from "@/tests/test.helper";
import path from "node:path";

describe("visibleDownloadSql", () => {
  const user = { id: "user-1", username: "u", role: "admin" as const, createdAt: new Date() };

  beforeEach(() => {
    testDbRef.current = createTestDb();
    seedTestUser(testDbRef.current, user);
    delete process.env.HARDLINK_PATH;
    delete process.env.HARDLINK_MOVIE_PATH;
    delete process.env.HARDLINK_TV_PATH;
  });

  it("shows local library sync rows under DOWNLOADS_PATH without torrent", async () => {
    const stagingRoot = path.resolve(process.env.DOWNLOADS_PATH || "./downloads");
    testDbRef.current.insert(media).values({ id: 980431, type: "movie", title: "Aang", imdbId: "tt1" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-local-sync",
        userId: user.id,
        mediaId: 980431,
        origin: "remote-sync",
        remoteLocation: path.join(stagingRoot, "Avatar Aang The Last Airbender (2026)"),
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    const visible = await downloadRepository.findByMediaIdVisible(980431);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe("dl-local-sync");
  });

  it("shows local sync when a storage module exists but is disabled (NULL moduleStorageId)", async () => {
    testDbRef.current
      .insert(module)
      .values({
        id: "storage-off",
        type: "ftp",
        category: "storage",
        enabled: false,
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

    const stagingRoot = path.resolve(process.env.DOWNLOADS_PATH || "./downloads");
    testDbRef.current.insert(media).values({ id: 1359, type: "movie", title: "Psycho", imdbId: "tt2" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-disabled-storage-env",
        userId: user.id,
        mediaId: 1359,
        origin: "remote-sync",
        remoteLocation: path.join(stagingRoot, "American Psycho (2000)"),
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    const visible = await downloadRepository.findByMediaIdVisible(1359);
    expect(visible).toHaveLength(1);
  });

  it("hides legacy NAS-style remoteLocation when storage and hardlink are off", async () => {
    testDbRef.current.insert(media).values({ id: 1, type: "movie", title: "Old", imdbId: "tt1" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-legacy-remote",
        userId: user.id,
        mediaId: 1,
        origin: "remote-sync",
        remoteLocation: "movies/Old Movie (2019)",
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    const visible = await downloadRepository.findByMediaIdVisible(1);
    expect(visible).toHaveLength(0);
  });

  it("getByMediaId API path returns local sync download for movie detail", async () => {
    const stagingRoot = path.resolve(process.env.DOWNLOADS_PATH || "./downloads");
    testDbRef.current.insert(media).values({ id: 42, type: "movie", title: "Synced", imdbId: "tt42" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-detail",
        userId: user.id,
        mediaId: 42,
        origin: "remote-sync",
        remoteLocation: path.join(stagingRoot, "Synced Movie (2024)"),
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    const { DownloadService } = await import("@/modules/download/download.service");
    const service = new DownloadService(user as never);
    const rows = await service.getByMediaId(42);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("dl-detail");
  });
});
