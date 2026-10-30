import { beforeEach, describe, expect, it } from "vitest";

import { getVisibleDownload } from "@/modules/download/download.access";
import { download } from "@/modules/download/download.schema";
import { media } from "@/modules/media/media.schema";
import {
  createTestDb,
  seedDisabledStorageModule,
  seedLocalLibrarySyncDownload,
  seedTestUser,
  testDbRef,
} from "@/tests/test.helper";
import path from "node:path";

describe("getVisibleDownload", () => {
  const user = { id: "user-1", username: "u", role: "admin" as const, createdAt: new Date() };

  beforeEach(() => {
    testDbRef.current = createTestDb();
    seedTestUser(testDbRef.current, user);
  });

  it("returns local sync row when storage module is disabled and moduleStorageId is null", async () => {
    seedDisabledStorageModule(testDbRef.current);
    const stagingRoot = path.resolve(process.env.DOWNLOADS_PATH || "./downloads");
    seedLocalLibrarySyncDownload(testDbRef.current, {
      downloadId: "dl-visible",
      userId: user.id,
      media: { id: 1359, type: "movie", title: "Psycho", imdbId: "tt1" },
      folderPath: path.join(stagingRoot, "American Psycho (2000)"),
    });

    await expect(getVisibleDownload("dl-visible")).resolves.toMatchObject({ id: "dl-visible" });
  });

  it("404 for legacy remote-only path without storage", async () => {
    testDbRef.current.insert(media).values({ id: 1, type: "movie", title: "Old", imdbId: "tt1" }).run();
    testDbRef.current
      .insert(download)
      .values({
        id: "dl-hidden",
        userId: user.id,
        mediaId: 1,
        origin: "remote-sync",
        remoteLocation: "movies/Old (2019)",
        torrent: null,
        createdAt: new Date(),
      })
      .run();

    await expect(getVisibleDownload("dl-hidden")).rejects.toMatchObject({ status: 404 });
  });
});
