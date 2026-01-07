import { eq } from "drizzle-orm";

import { AuthenticatedService } from "@/classes/authenticated-service";
import { db } from "@/db/db";
import { torrentDownload } from "@/db/schema";
import type { User } from "../user/user.dto";
import type { DownloadTorrentInput, TorrentDownload, TorrentLiveData } from "./download.dto";
import { WebTorrentClient } from "./webtorrent.client";
import { extractTorrentLiveData } from "./webtorrent.helper";

/**
 * Service for managing torrent downloads
 * Handles CRUD operations and lifecycle management (start, pause, resume, delete)
 */
export class DownloadService extends AuthenticatedService {
  private downloadPath: string;

  constructor(user: User) {
    super(user);
    this.downloadPath = process.env.DOWNLOADS_PATH || "./downloads";
  }

  async startDownload(input: DownloadTorrentInput): Promise<TorrentDownload> {
    const client = WebTorrentClient.getClient();
    const { magnetUri, name, mediaId, origin, quality, language } = input;

    // Check if download already exists in DB
    const existingDownload = await db.query.torrentDownload.findFirst({
      where: eq(torrentDownload.magnetUri, magnetUri),
    });

    if (existingDownload) {
      console.log(`[DOWNLOAD] Download already exists: ${existingDownload.name}`);
      // If it exists and is completed, ensure it's still seeding
      if (existingDownload.status === "completed") {
        const activeTorrent = WebTorrentClient.getActiveTorrent(existingDownload.id);
        if (!activeTorrent) {
          // Re-add for seeding if not active
          const restored = client.add(existingDownload.magnetUri, {
            path: this.downloadPath,
          });
          WebTorrentClient.setupTorrentHandlers(restored, existingDownload.id, this.downloadPath);
          console.log(
            `[DOWNLOAD] Re-added completed download for seeding: ${existingDownload.name}`,
          );
        }
      }
      return existingDownload;
    }

    // Create new download entry in DB
    const [newDownload] = await db
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

    if (!newDownload) {
      throw new Error("Failed to create download entry.");
    }

    // Add to WebTorrent client
    const torrent = client.add(magnetUri, { path: this.downloadPath });
    WebTorrentClient.setupTorrentHandlers(torrent, newDownload.id, this.downloadPath);

    console.log(`[DOWNLOAD] Started download for: ${name}`);
    return newDownload;
  }

  async listDownloads(): Promise<(TorrentDownload & { live?: TorrentLiveData })[]> {
    // Fetch downloads from DB for the current user
    const downloads = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.userId, this.user.id))
      .all();

    // Enrich with live data from WebTorrent for active downloads
    return downloads.map((download) => {
      const activeTorrent = WebTorrentClient.getActiveTorrent(download.id);
      if (activeTorrent) {
        return {
          ...download,
          live: extractTorrentLiveData(activeTorrent),
        };
      }
      return download;
    });
  }

  async getDownloadById(
    id: string,
  ): Promise<(TorrentDownload & { live?: TorrentLiveData }) | null> {
    const [download] = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.id, id))
      .limit(1);

    if (!download) return null;

    // Merge with live data from WebTorrent if active
    const activeTorrent = WebTorrentClient.getActiveTorrent(id);
    if (activeTorrent) {
      return {
        ...download,
        live: extractTorrentLiveData(activeTorrent),
      };
    }

    return download;
  }

  async deleteDownload(id: string): Promise<void> {
    const activeTorrent = WebTorrentClient.getActiveTorrent(id);
    if (activeTorrent) {
      activeTorrent.destroy();
      WebTorrentClient.deleteActiveTorrent(id);
    }

    // Delete from DB
    await db.delete(torrentDownload).where(eq(torrentDownload.id, id));
  }

  async pauseDownload(id: string): Promise<void> {
    const activeTorrent = WebTorrentClient.getActiveTorrent(id);
    if (!activeTorrent) {
      const [dbDownload] = await db
        .select()
        .from(torrentDownload)
        .where(eq(torrentDownload.id, id))
        .limit(1);

      if (!dbDownload) {
        throw new Error("Download not found");
      }

      throw new Error(`Download is not active. Current status: ${dbDownload.status}`);
    }

    // Destroy all peer connections to truly pause
    activeTorrent.destroy({ destroyStore: false });
    WebTorrentClient.deleteActiveTorrent(id);
    console.log(`[DOWNLOAD] Paused: ${activeTorrent.name}`);

    // Update status in database
    await db.update(torrentDownload).set({ status: "paused" }).where(eq(torrentDownload.id, id));
  }

  async resumeDownload(id: string): Promise<void> {
    const [dbDownload] = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.id, id))
      .limit(1);

    if (!dbDownload) {
      throw new Error("Download not found");
    }

    if (dbDownload.status !== "paused") {
      throw new Error(`Cannot resume download with status: ${dbDownload.status}`);
    }

    console.log(`[DOWNLOAD] Resuming download: ${dbDownload.name}`);

    const client = WebTorrentClient.getClient();
    const activeTorrent = client.add(dbDownload.magnetUri, {
      path: this.downloadPath,
    });

    WebTorrentClient.setupTorrentHandlers(activeTorrent, id, this.downloadPath);

    // Wait for torrent to be ready before adding to active map
    await new Promise<void>((resolve) => {
      activeTorrent.on("ready", () => resolve());
    });

    WebTorrentClient.setActiveTorrent(id, activeTorrent);
    console.log(`[DOWNLOAD] Resumed: ${activeTorrent.name}`);

    // Update status in database
    await db
      .update(torrentDownload)
      .set({ status: "downloading" })
      .where(eq(torrentDownload.id, id));
  }
}
