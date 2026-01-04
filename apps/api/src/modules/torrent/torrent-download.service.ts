import { eq, or } from "drizzle-orm";
import type WebTorrent from "webtorrent";

import { AuthenticatedService } from "@/classes/authenticated-service";
import { db } from "@/db/db";
import { torrentDownload } from "@/db/schema";
import * as path from "node:path";
import type { User } from "../user/user.dto";
import type { DownloadTorrentInput, TorrentDownload, TorrentLiveData } from "./torrent.dto";
import { extractTorrentLiveData, findLargestVideoFile } from "./webtorrent.helper";

export class TorrentDownloadService extends AuthenticatedService {
  private static client: WebTorrent.Instance | null = null;
  private static activeTorrents = new Map<string, WebTorrent.Torrent>();
  private static initError: Error | null = null;
  private static isInitialized = false;
  private static isInitializing = false;
  private downloadPath: string;

  constructor(user: User) {
    super(user);
    this.downloadPath = process.env.DOWNLOADS_PATH || "./downloads";

    // Don't throw error if not initialized yet - allow graceful degradation
    if (TorrentDownloadService.initError) {
      console.warn("[TORRENT] Service has initialization error, torrent features disabled");
    }
  }

  /**
   * Initialize WebTorrent client and restore active torrents (non-blocking)
   * Should be called once at server startup without await
   */
  static async initialize(downloadPath: string): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      console.log("[TORRENT] Already initialized or initializing, skipping...");
      return;
    }

    this.isInitializing = true;

    try {
      console.log("[TORRENT] Initializing WebTorrent...");
      const WebTorrent = (await import("webtorrent")).default;
      this.client = new WebTorrent();

      console.log("[TORRENT] WebTorrent client created");

      // Restore torrents in background - don't await
      this.restoreActiveTorrents(downloadPath).catch((error) => {
        console.error("[TORRENT] Failed to restore torrents:", error);
      });

      this.isInitialized = true;
      this.isInitializing = false;
      console.log("[TORRENT] Initialization complete");
    } catch (error) {
      console.error("[TORRENT] Failed to initialize WebTorrent:", error);
      this.initError = error as Error;
      this.isInitializing = false;
      // Don't throw - allow server to continue
    }
  }

  private getClient(): WebTorrent.Instance {
    if (TorrentDownloadService.initError) {
      throw new Error(
        `WebTorrent client failed to initialize: ${TorrentDownloadService.initError.message}`,
      );
    }
    if (!TorrentDownloadService.client) {
      throw new Error("WebTorrent client not initialized yet. Please try again in a moment.");
    }
    return TorrentDownloadService.client;
  }

  async startDownload(input: DownloadTorrentInput): Promise<TorrentDownload> {
    const client = this.getClient();
    const { magnetUri, name, mediaId, origin, quality, language } = input;

    // Check if torrent already exists in DB
    const existingTorrent = await db.query.torrentDownload.findFirst({
      where: eq(torrentDownload.magnetUri, magnetUri),
    });

    if (existingTorrent) {
      console.log(`[TORRENT] Torrent already exists: ${existingTorrent.name}`);
      // If it exists and is completed, ensure it's still seeding
      if (existingTorrent.status === "completed") {
        const activeTorrent = TorrentDownloadService.activeTorrents.get(existingTorrent.id);
        if (!activeTorrent) {
          // Re-add for seeding if not active
          const restored = client.add(existingTorrent.magnetUri, {
            path: this.downloadPath,
          });
          this.setupTorrentHandlers(restored, existingTorrent.id);
          console.log(`[TORRENT] Re-added completed torrent for seeding: ${existingTorrent.name}`);
        }
      }
      return existingTorrent;
    }

    // Create new torrent entry in DB
    const [newTorrent] = await db
      .insert(torrentDownload)
      .values({
        userId: this.user.id,
        magnetUri,
        infoHash: "",
        name,
        mediaId,
        origin,
        quality,
        language,
        status: "queued",
      })
      .returning();

    if (!newTorrent) {
      throw new Error("Failed to create torrent download entry.");
    }

    // Add to WebTorrent client
    const torrent = client.add(magnetUri, { path: this.downloadPath });
    this.setupTorrentHandlers(torrent, newTorrent.id);

    console.log(`[TORRENT] Started download for: ${name}`);
    return newTorrent;
  }

  async listTorrents(): Promise<(TorrentDownload & { live?: TorrentLiveData })[]> {
    // Fetch torrents from DB for the current user
    const torrents = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.userId, this.user.id))
      .all();

    // Enrich with live data from WebTorrent for active torrents
    return torrents.map((torrent) => {
      const activeTorrent = TorrentDownloadService.activeTorrents.get(torrent.id);
      if (activeTorrent) {
        return {
          ...torrent,
          live: extractTorrentLiveData(activeTorrent),
        };
      }
      return torrent;
    });
  }

  async getTorrentById(id: string): Promise<(TorrentDownload & { live?: TorrentLiveData }) | null> {
    const [torrent] = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.id, id))
      .limit(1);

    if (!torrent) return null;

    // Merge with live data from WebTorrent if active
    const activeTorrent = TorrentDownloadService.activeTorrents.get(id);
    if (activeTorrent) {
      return {
        ...torrent,
        live: extractTorrentLiveData(activeTorrent),
      };
    }

    return torrent;
  }

  async deleteTorrent(id: string): Promise<void> {
    const activeTorrent = TorrentDownloadService.activeTorrents.get(id);
    if (activeTorrent) {
      activeTorrent.destroy();
      TorrentDownloadService.activeTorrents.delete(id);
    }

    // Delete from DB
    await db.delete(torrentDownload).where(eq(torrentDownload.id, id));
  }

  async pauseTorrent(id: string): Promise<void> {
    const activeTorrent = TorrentDownloadService.activeTorrents.get(id);
    if (!activeTorrent) {
      const [dbTorrent] = await db
        .select()
        .from(torrentDownload)
        .where(eq(torrentDownload.id, id))
        .limit(1);

      if (!dbTorrent) {
        throw new Error("Torrent not found");
      }

      throw new Error(`Torrent is not active. Current status: ${dbTorrent.status}`);
    }

    // Destroy all peer connections to truly pause
    activeTorrent.destroy({ destroyStore: false });
    TorrentDownloadService.activeTorrents.delete(id);
    console.log(`[TORRENT] Paused: ${activeTorrent.name}`);

    // Update status in database
    await db.update(torrentDownload).set({ status: "paused" }).where(eq(torrentDownload.id, id));
  }

  async resumeTorrent(id: string): Promise<void> {
    const [dbTorrent] = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.id, id))
      .limit(1);

    if (!dbTorrent) {
      throw new Error("Torrent not found");
    }

    if (dbTorrent.status !== "paused") {
      throw new Error(`Cannot resume torrent with status: ${dbTorrent.status}`);
    }

    console.log(`[TORRENT] Resuming torrent: ${dbTorrent.name}`);

    if (!TorrentDownloadService.client) {
      throw new Error("WebTorrent client not initialized");
    }

    const activeTorrent = TorrentDownloadService.client.add(dbTorrent.magnetUri, {
      path: this.downloadPath,
    });

    this.setupTorrentHandlers(activeTorrent, id);

    // Wait for torrent to be ready before adding to active map
    await new Promise<void>((resolve) => {
      activeTorrent.on("ready", () => resolve());
    });

    TorrentDownloadService.activeTorrents.set(id, activeTorrent);
    console.log(`[TORRENT] Resumed: ${activeTorrent.name}`);

    // Update status in database
    await db
      .update(torrentDownload)
      .set({ status: "downloading" })
      .where(eq(torrentDownload.id, id));
  }

  async getStreamForTorrent(
    id: string,
  ): Promise<{ stream: NodeJS.ReadableStream; size: number; fileName: string } | null> {
    // Check active torrents first (downloading/seeding)
    const activeTorrent = TorrentDownloadService.activeTorrents.get(id);
    if (activeTorrent) {
      const videoFile = findLargestVideoFile(activeTorrent);
      if (!videoFile) return null;
      return {
        stream: videoFile.createReadStream(),
        size: videoFile.length,
        fileName: videoFile.name,
      };
    }

    // Check torrents on disk (completed, downloading, or paused)
    const [torrent] = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.id, id))
      .limit(1);

    if (!torrent) return null;

    // Don't try to stream failed torrents
    if (torrent.status === "failed") return null;

    const fullPath = path.join(this.downloadPath, torrent.savePath || torrent.name);

    const fs = await import("node:fs/promises");
    const fsSync = await import("node:fs");
    const videoExtensions = /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v)$/i;

    try {
      const stats = await fs.stat(fullPath);

      // Single file
      if (stats.isFile()) {
        const fileName = path.basename(fullPath);
        if (!videoExtensions.test(fileName)) return null;
        return {
          stream: fsSync.createReadStream(fullPath),
          size: stats.size,
          fileName,
        };
      }

      // Directory - find largest video
      const files = await fs.readdir(fullPath, { recursive: true, withFileTypes: true });
      const videoFiles = await Promise.all(
        files
          .filter((file) => file.isFile() && videoExtensions.test(file.name))
          .map(async (file) => {
            const filePath = path.join(file.parentPath || fullPath, file.name);
            const fileStats = await fs.stat(filePath);
            return { path: filePath, name: file.name, size: fileStats.size };
          }),
      );

      if (videoFiles.length === 0) return null;
      const largestVideo = videoFiles.sort((a, b) => b.size - a.size)[0];
      return {
        stream: fsSync.createReadStream(largestVideo.path),
        size: largestVideo.size,
        fileName: largestVideo.name,
      };
    } catch {
      return null;
    }
  }

  private setupTorrentHandlers(torrent: WebTorrent.Torrent, torrentId: string) {
    TorrentDownloadService.setupTorrentHandlersStatic(torrent, torrentId, this.downloadPath);
  }

  private static setupTorrentHandlersStatic(
    torrent: WebTorrent.Torrent,
    torrentId: string,
    downloadPath: string,
  ) {
    torrent.on("ready", async () => {
      console.log(`[TORRENT] Ready: ${torrent.name}`);
      await db
        .update(torrentDownload)
        .set({
          infoHash: torrent.infoHash,
          magnetUri: torrent.magnetURI,
          name: torrent.name,
          size: torrent.length,
          status: "downloading",
          startedAt: new Date(),
        })
        .where(eq(torrentDownload.id, torrentId));

      this.activeTorrents.set(torrentId, torrent);
    });

    torrent.on("done", async () => {
      const savePath = path.relative(downloadPath, torrent.path);
      console.log(`[TORRENT] Completed: ${torrent.name}`);
      await db
        .update(torrentDownload)
        .set({
          status: "completed",
          completedAt: new Date(),
          savePath,
        })
        .where(eq(torrentDownload.id, torrentId));
    });

    (torrent as unknown as { on: (event: string, callback: (err: Error) => void) => void }).on(
      "error",
      async (err: Error) => {
        console.error(`[TORRENT] Error: ${torrent.name} - ${err.message}`);
        await db
          .update(torrentDownload)
          .set({
            status: "failed",
            error: err.message,
          })
          .where(eq(torrentDownload.id, torrentId));
      },
    );
  }

  private static async restoreActiveTorrents(downloadPath: string) {
    const torrents = await db
      .select()
      .from(torrentDownload)
      .where(
        or(
          eq(torrentDownload.status, "downloading"),
          eq(torrentDownload.status, "paused"),
          eq(torrentDownload.status, "completed"),
        ),
      )
      .all();

    if (torrents.length > 0) {
      console.log(`[TORRENT] Restoring ${torrents.length} torrent(s)...`);
    }

    for (const torrent of torrents) {
      if (!torrent.magnetUri || !this.client) continue;

      try {
        // Skip paused torrents - they will be restored when resumed
        if (torrent.status === "paused") {
          console.log(`[TORRENT] Skipped paused: ${torrent.name}`);
          continue;
        }

        console.log(`[TORRENT] Restoring: ${torrent.name} (${torrent.status})`);
        const restored = this.client.add(torrent.magnetUri, {
          path: downloadPath,
        });
        this.setupTorrentHandlersStatic(restored, torrent.id, downloadPath);

        // Wait for torrent to be ready before adding to active map
        await new Promise<void>((resolve) => {
          restored.on("ready", () => resolve());
        });

        this.activeTorrents.set(torrent.id, restored);
      } catch (error) {
        console.error(`[TORRENT] Failed to restore: ${torrent.name}`, error);
      }
    }
  }
}
