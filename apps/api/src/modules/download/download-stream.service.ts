import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { torrentDownload } from "@/db/schema";
import * as path from "node:path";
import type { TorrentDownload } from "./download.dto";
import { WebTorrentClient } from "./webtorrent.client";
import { findLargestVideoFile } from "./webtorrent.helper";

export interface StreamResult {
  stream: NodeJS.ReadableStream;
  size: number;
  fileName: string;
  filePath?: string;
}

/**
 * Service for streaming video files from downloads
 * Handles both active torrents and completed files on disk
 */
export class DownloadStreamService {
  constructor(private downloadPath: string) {}

  async getStreamForDownload(id: string): Promise<StreamResult | null> {
    // Check active torrents first (downloading/seeding)
    const activeTorrent = WebTorrentClient.getActiveTorrent(id);
    if (activeTorrent) {
      const videoFile = findLargestVideoFile(activeTorrent);
      if (!videoFile) return null;

      return {
        stream: videoFile.createReadStream(),
        size: videoFile.length,
        fileName: videoFile.name,
        filePath: path.join(activeTorrent.path, videoFile.path),
      };
    }

    // Check downloads on disk
    return this.getStreamFromDisk(id);
  }

  private async getStreamFromDisk(id: string): Promise<StreamResult | null> {
    const [download] = await db
      .select()
      .from(torrentDownload)
      .where(eq(torrentDownload.id, id))
      .limit(1);

    if (!download) return null;
    if (download.status === "failed") return null;

    const fullPath = this.getFullPath(download);
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
          filePath: fullPath,
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
        filePath: largestVideo.path,
      };
    } catch {
      return null;
    }
  }

  private getFullPath(download: TorrentDownload, relativePath?: string): string {
    const basePath = path.join(this.downloadPath, download.savePath || download.name);
    return relativePath ? path.join(basePath, relativePath) : basePath;
  }
}
