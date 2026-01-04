import { eq, or } from "drizzle-orm";
import type WebTorrent from "webtorrent";

import { AuthenticatedService } from "@/classes/authenticated-service";
import { transformIndexerUrl } from "@/config/indexer.config";
import { db } from "@/db/db";
import { type TorrentDownload, torrentDownload, type User } from "@/db/schema";
import * as path from "node:path";
import type { TorrentLiveData } from "./torrent.dto";
import { extractTorrentLiveData, findLargestVideoFile } from "./webtorrent.helper";

export class TorrentDownloadService extends AuthenticatedService {
  private static client: WebTorrent.Instance | null = null;
  private static activeTorrents = new Map<string, WebTorrent.Torrent>();
  private static initError: Error | null = null;
  private static initPromise: Promise<void> | null = null;
  private downloadPath: string;

  constructor(user: User) {
    super(user);
    this.downloadPath = process.env.DOWNLOADS_PATH || "./downloads";

    // Start initialization if not already started
    if (
      !TorrentDownloadService.initPromise &&
      !TorrentDownloadService.client &&
      !TorrentDownloadService.initError
    ) {
      TorrentDownloadService.initPromise = this.initializeWebTorrent();
    }
  }

  private async initializeWebTorrent() {
    try {
      console.log("[TORRENT] Initializing WebTorrent...");
      const WebTorrent = (await import("webtorrent")).default;
      TorrentDownloadService.client = new WebTorrent();

      console.log("[TORRENT] WebTorrent initialized successfully");

      // Restore active torrents from database
      await this.restoreActiveTorrents();
    } catch (error) {
      console.error("[TORRENT] Failed to initialize WebTorrent:", error);
      TorrentDownloadService.initError = error as Error;
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (TorrentDownloadService.initPromise) {
      await TorrentDownloadService.initPromise;
    }
  }

  private async checkClient(): Promise<void> {
    await this.ensureInitialized();

    if (!TorrentDownloadService.client) {
      throw new Error(
        "WebTorrent is not available. Torrent downloads require native modules that may not be compatible with the Node.js runtime.",
      );
    }
  }

  async startDownload(
    magnetUri: string,
    name: string,
    mediaId?: number,
    origin?: string,
    quality?: string,
    language?: string,
  ): Promise<TorrentDownload> {
    await this.checkClient();

    if (!TorrentDownloadService.client) {
      throw new Error("WebTorrent client is not available");
    }

    // Transform URL if needed (e.g., localhost to host.docker.internal in Docker)
    const torrentSource = transformIndexerUrl(magnetUri);

    let torrentInput: string | Buffer = torrentSource;

    // Download .torrent file for HTTP URLs (Prowlarr/Jackett)
    // Some indexers (like Prowlarr) redirect to magnet links instead of serving .torrent files
    if (torrentSource.startsWith("http")) {
      try {
        console.log(`[TORRENT] Fetching from indexer: ${torrentSource}`);
        const response = await fetch(torrentSource, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
          redirect: "manual", // Don't follow redirects automatically
        });

        // Check if it's a redirect to a magnet link (common with Prowlarr)
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (location?.startsWith("magnet:")) {
            console.log(`[TORRENT] Indexer redirected to magnet link`);
            torrentInput = location;
          } else if (location) {
            console.log(`[TORRENT] Following redirect to: ${location}`);
            // Follow HTTP redirect
            const redirectResponse = await fetch(location, {
              signal: AbortSignal.timeout(10000),
            });
            if (!redirectResponse.ok) {
              throw new Error(`HTTP ${redirectResponse.status}: ${redirectResponse.statusText}`);
            }
            const arrayBuffer = await redirectResponse.arrayBuffer();
            torrentInput = Buffer.from(arrayBuffer);
            console.log(
              `[TORRENT] Successfully downloaded .torrent file (${torrentInput.length} bytes)`,
            );
          } else {
            throw new Error("Redirect without Location header");
          }
        } else if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } else {
          // Direct .torrent file download
          const arrayBuffer = await response.arrayBuffer();
          torrentInput = Buffer.from(arrayBuffer);
          console.log(
            `[TORRENT] Successfully downloaded .torrent file (${torrentInput.length} bytes)`,
          );
        }
      } catch (error) {
        console.error(`[TORRENT] Failed to fetch torrent`);
        console.error(`[TORRENT] Error details:`, error);

        // Extract more details from the error
        let errorMsg = "Unknown error";
        if (error instanceof Error) {
          errorMsg = error.message;
          if (error.cause) {
            console.error(`[TORRENT] Error cause:`, error.cause);
          }
        }

        // Provide helpful error messages based on error type
        if (errorMsg.includes("ECONNREFUSED")) {
          throw new Error(
            `Cannot connect to indexer at ${torrentSource.split("?")[0]} - is Prowlarr/Jackett running?`,
          );
        }
        if (errorMsg.includes("ETIMEDOUT") || errorMsg.includes("timeout")) {
          throw new Error(`Request to indexer timed out - check network connectivity`);
        }
        if (errorMsg.includes("ENOTFOUND")) {
          throw new Error(`Cannot resolve hostname - check indexer URL configuration`);
        }

        throw new Error(`Cannot download torrent: ${errorMsg}`);
      }
    }

    console.log(`[TORRENT] Starting WebTorrent download for: ${name}`);

    // Create DB entry
    const torrentId = crypto.randomUUID();
    const [newTorrent] = await db
      .insert(torrentDownload)
      .values({
        id: torrentId,
        userId: this.user.id,
        mediaId,
        magnetUri: torrentSource, // Store the transformed URL
        infoHash: "", // Will be updated when torrent is ready
        name, // Use name from frontend
        status: "queued",
        origin,
        quality,
        language,
      })
      .returning();

    // Start WebTorrent download (accepts magnet URIs, .torrent URLs, or .torrent file buffers)
    const torrent = TorrentDownloadService.client.add(torrentInput, {
      path: this.downloadPath,
    });

    torrent.on("ready", async () => {
      console.log(`[TORRENT] Torrent ready: ${torrent.name} (infoHash: ${torrent.infoHash})`);
      await db
        .update(torrentDownload)
        .set({
          infoHash: torrent.infoHash,
          magnetUri: torrent.magnetURI, // Update with real magnet URI for restoration
          name: torrent.name,
          size: torrent.length,
          status: "downloading",
          startedAt: new Date(),
        })
        .where(eq(torrentDownload.id, torrentId));

      TorrentDownloadService.activeTorrents.set(torrentId, torrent);
    });

    torrent.on("done", async () => {
      console.log(`[TORRENT] Download completed: ${torrent.name}`);
      await db
        .update(torrentDownload)
        .set({
          status: "completed",
          completedAt: new Date(),
          savePath: path.relative(this.downloadPath, torrent.path),
        })
        .where(eq(torrentDownload.id, torrentId));
    });

    // Error event handler - WebTorrent types don't include this but it exists at runtime
    (torrent as unknown as { on: (event: string, callback: (err: Error) => void) => void }).on(
      "error",
      async (err: Error) => {
        console.error(`[TORRENT] Error downloading ${name}:`, err.message);
        console.error(`[TORRENT] Full error:`, err);
        await db
          .update(torrentDownload)
          .set({
            status: "failed",
            error: err.message,
          })
          .where(eq(torrentDownload.id, torrentId));
      },
    );

    return newTorrent;
  }

  async listTorrents(
    includeAll = false,
  ): Promise<Array<TorrentDownload & { live?: TorrentLiveData }>> {
    let torrents: TorrentDownload[];

    if (includeAll && ["owner", "admin"].includes(this.user.role)) {
      torrents = await db.select().from(torrentDownload).all();
    } else {
      torrents = await db
        .select()
        .from(torrentDownload)
        .where(eq(torrentDownload.userId, this.user.id))
        .all();
    }

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

  // Streaming: Get readable stream for a torrent file
  getStreamForTorrent(id: string): { stream: NodeJS.ReadableStream; size: number } | null {
    const activeTorrent = TorrentDownloadService.activeTorrents.get(id);
    if (!activeTorrent) return null;

    // Find largest video file using helper
    const videoFile = findLargestVideoFile(activeTorrent);
    if (!videoFile) return null;

    return {
      stream: videoFile.createReadStream(),
      size: videoFile.length,
    };
  }

  private async restoreActiveTorrents() {
    // Restore active torrents on server restart (queued or downloading)
    const activeTorrents = await db
      .select()
      .from(torrentDownload)
      .where(or(eq(torrentDownload.status, "downloading"), eq(torrentDownload.status, "queued")))
      .all();

    if (activeTorrents.length > 0) {
      console.log(
        `[TORRENT] Restoring ${activeTorrents.length} active torrent(s) from database...`,
      );
    }

    for (const torrent of activeTorrents) {
      try {
        console.log(`[TORRENT] Restoring torrent: ${torrent.name} (${torrent.id})`);

        if (!TorrentDownloadService.client) {
          console.error(`[TORRENT] WebTorrent client not available, skipping restore`);
          continue;
        }

        // Re-add the torrent to WebTorrent using the stored magnetUri
        // Note: If the magnetUri is an HTTP URL (not yet converted to magnet:), it may fail
        // In that case, the torrent will be marked as failed
        const restoredTorrent = TorrentDownloadService.client.add(torrent.magnetUri, {
          path: this.downloadPath,
        });

        // Set up event handlers
        restoredTorrent.on("ready", async () => {
          console.log(`[TORRENT] Restored torrent ready: ${restoredTorrent.name}`);
          await db
            .update(torrentDownload)
            .set({
              infoHash: restoredTorrent.infoHash,
              magnetUri: restoredTorrent.magnetURI, // Update with real magnet URI
              name: restoredTorrent.name,
              size: restoredTorrent.length,
              status: "downloading",
              startedAt: new Date(),
            })
            .where(eq(torrentDownload.id, torrent.id));

          TorrentDownloadService.activeTorrents.set(torrent.id, restoredTorrent);
        });

        restoredTorrent.on("done", async () => {
          console.log(`[TORRENT] Restored torrent completed: ${restoredTorrent.name}`);
          await db
            .update(torrentDownload)
            .set({
              status: "completed",
              completedAt: new Date(),
              savePath: path.relative(this.downloadPath, restoredTorrent.path),
            })
            .where(eq(torrentDownload.id, torrent.id));
        });

        (
          restoredTorrent as unknown as {
            on: (event: string, callback: (err: Error) => void) => void;
          }
        ).on("error", async (err: Error) => {
          console.error(`[TORRENT] Error restoring ${torrent.name}:`, err.message);

          // If the error is about fetching (HTTP URL expired), provide helpful message
          const errorMessage = err.message.includes("fetch failed")
            ? "Cannot restore: download URL expired. Please restart download from indexer."
            : err.message;

          await db
            .update(torrentDownload)
            .set({
              status: "failed",
              error: errorMessage,
            })
            .where(eq(torrentDownload.id, torrent.id));
        });
      } catch (error) {
        console.error(`[TORRENT] Failed to restore torrent ${torrent.name}:`, error);
        await db
          .update(torrentDownload)
          .set({
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to restore after restart",
          })
          .where(eq(torrentDownload.id, torrent.id));
      }
    }
  }
}
