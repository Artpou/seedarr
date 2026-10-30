import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { schema } from "@/db/schema";
import type { TorrentLiveData } from "@/modules/download/download.schema";
import { download } from "@/modules/download/download.schema";
import type { Media } from "@/modules/media/media.schema";
import { media } from "@/modules/media/media.schema";
import { module } from "@/modules/module/module.schema";
import type { User } from "@/modules/user/user.schema";
import { user } from "@/modules/user/user.schema";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const MIGRATIONS_FOLDER = path.resolve(__dirname, "../db/drizzle");

export type TestDb = ReturnType<typeof createTestDb>;

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

export type TestDbRef = {
  current: TestDb;
};

function createTestDbRef(): TestDbRef {
  let dbInstance: TestDb | null = null;
  return {
    get current(): TestDb {
      if (!dbInstance) {
        throw new Error("TestDb is not initialized. Did you forget testDbRef.current = createTestDb() in beforeEach?");
      }
      return dbInstance;
    },
    set current(val: TestDb) {
      dbInstance = val;
    },
  };
}

/**
 * Shared in-memory DB for the current test file.
 * Assign in `beforeEach`: `testDbRef.current = createTestDb()`.
 * Accessing `.current` before init throws (no silent `null` / `!`).
 */
export const testDbRef = createTestDbRef();

export function seedTestUser(db: TestDb, fakeUser: Pick<User, "id" | "username" | "role" | "createdAt">): void {
  db.insert(user)
    .values({
      id: fakeUser.id,
      username: fakeUser.username,
      password: "x",
      role: fakeUser.role,
      createdAt: fakeUser.createdAt,
    })
    .run();
}

export function createAuthGuardMock(fakeUser: Pick<User, "id" | "username" | "role" | "createdAt">) {
  return async (c: unknown, next: () => Promise<void>) => {
    (c as { set: (k: string, v: unknown) => void }).set("user", fakeUser);
    await next();
  };
}

export function sampleTorrent(overrides: Partial<TorrentLiveData> = {}): TorrentLiveData {
  return {
    infoHash: "abc",
    magnetURI: "magnet:?xt=urn:btih:abc",
    announce: [],
    "announce-list": [],
    timeRemaining: 0,
    received: 0,
    downloaded: 0,
    uploaded: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    progress: 0.5,
    ratio: 0,
    length: 1000,
    pieceLength: 524288,
    lastPieceLength: 0,
    numPeers: 0,
    path: "./downloads",
    ready: true,
    paused: false,
    done: false,
    name: "Test",
    created: new Date(),
    maxWebConns: 4,
    files: [],
    ...overrides,
  };
}

export function json(method: "POST" | "PATCH" | "PUT", body: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: test helper for untyped JSON responses
export async function bodyOf(res: Response): Promise<any> {
  return res.json();
}

/** Disabled FTP module — reproduces NULL moduleStorageId + storage-off visibility cases. */
export function seedDisabledStorageModule(db: TestDb, id = "storage-off"): void {
  db.insert(module)
    .values({
      id,
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
}

export async function withTempDownloadsRoot<T>(run: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "seedarr-dl-"));
  const previous = process.env.DOWNLOADS_PATH;
  process.env.DOWNLOADS_PATH = root;
  try {
    return await run(root);
  } finally {
    if (previous === undefined) delete process.env.DOWNLOADS_PATH;
    else process.env.DOWNLOADS_PATH = previous;
  }
}

/** Remote-sync row under DOWNLOADS_PATH (torrent cleared). */
export function seedLocalLibrarySyncDownload(
  db: TestDb,
  input: {
    downloadId: string;
    userId: string;
    media: Pick<Media, "id" | "type" | "title"> & { imdbId: string };
    folderPath: string;
  },
): void {
  db.insert(media)
    .values({
      id: input.media.id,
      type: input.media.type,
      title: input.media.title,
      imdbId: input.media.imdbId,
    })
    .run();
  db.insert(download)
    .values({
      id: input.downloadId,
      userId: input.userId,
      mediaId: input.media.id,
      origin: "remote-sync",
      remoteLocation: input.folderPath,
      torrent: null,
      createdAt: new Date(),
    })
    .run();
}
