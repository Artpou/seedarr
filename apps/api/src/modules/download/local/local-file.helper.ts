import { formatError, VIDEO_EXTENSIONS } from "@seedarr/shared";

import { NotFoundError, UnauthorizedError } from "@/shared/errors/error";
import { verifyToken } from "@/shared/helpers/crypto.helper";
import { logger } from "@/shared/helpers/logger.helper";

import { downloadRepository } from "@/modules/download/download.repository";
import type { Download } from "@/modules/download/download.schema";
import { resolveDownloadLocalVideo } from "@/modules/download/paths.helper";
import { remoteStorageService } from "@/modules/storage-config/remote/remote-storage.service";
import { resolveRemoteVideoInfo } from "@/modules/streaming/streaming.helper";
import fs from "node:fs/promises";
import path from "node:path";

export type DownloadableFile = {
  fileName: string;
  size: number;
  filePath?: string;
  remotePath?: string;
};

export function assertDownloadFileToken(token: string, downloadId: string): { userId: string } {
  const payload = verifyToken<{ downloadId: string; userId: string }>(token);
  if (!payload || payload.downloadId !== downloadId || typeof payload.userId !== "string") {
    logger.warn("DOWNLOAD", `Invalid file download token for download ${downloadId}`);
    throw new UnauthorizedError("Invalid or expired download token");
  }
  return { userId: payload.userId };
}

/** Verify a remote video actually exists and is readable (list + size > 0). */
async function resolveReadableRemoteFile(item: Download): Promise<DownloadableFile | null> {
  if (!item.remoteLocation) return null;

  try {
    const info = await resolveRemoteVideoInfo(item, item.remoteLocation);
    if (!info) return null;

    const files = await remoteStorageService.listFiles(item.remoteLocation);
    const videos = files
      .filter((f) => VIDEO_EXTENSIONS.test(f.name) && f.length > 0)
      .sort((a, b) => b.length - a.length);
    const matched =
      videos.find(
        (f) => f.name === info.fileName || info.remotePath.endsWith(`/${f.path}`) || info.remotePath.endsWith(f.name),
      ) ?? videos[0];

    if (!matched) return null;

    const remotePath = VIDEO_EXTENSIONS.test(item.remoteLocation.split("/").pop() ?? "")
      ? item.remoteLocation
      : `${item.remoteLocation.replace(/\/+$/, "")}/${matched.path}`.replace(/\/+/g, "/");

    return { fileName: matched.name, size: matched.length, remotePath };
  } catch (error) {
    logger.warn("DOWNLOAD", `Remote file verify failed for ${item.id}: ${formatError(error)}`);
    return null;
  }
}

/**
 * Resolve a downloadable attachment by id.
 * Prefers a verified remote file, otherwise a completed local torrent file.
 */
export async function getDownloadableFile(id: string): Promise<DownloadableFile> {
  const item = await downloadRepository.get(id);

  const remote = await resolveReadableRemoteFile(item);
  if (remote) return remote;

  const local = await resolveDownloadLocalVideo(item);
  if (local && local.size > 0) return { fileName: local.fileName, size: local.size, filePath: local.filePath };

  throw new NotFoundError("Downloadable file");
}

/** Open a readable stream for a resolved downloadable file (local or remote). */
export async function openDownloadableReadStream(
  file: DownloadableFile,
): Promise<{ stream: NodeJS.ReadableStream; cleanup?: () => void }> {
  if (file.filePath) {
    const fsSync = await import("node:fs");
    return { stream: fsSync.createReadStream(file.filePath) };
  }
  if (!file.remotePath) throw new NotFoundError("Downloadable file");
  const remote = await remoteStorageService.createReadStream(file.remotePath);
  if (!remote) throw new NotFoundError("Downloadable file");
  return { stream: remote.stream as NodeJS.ReadableStream, cleanup: remote.cleanup };
}

export interface LocalDiskSpace {
  used: number;
  total: number;
}

/** Disk usage for the filesystem that contains `dirPath` (creates the dir if missing). */
export async function getLocalDiskSpace(dirPath: string): Promise<LocalDiskSpace | null> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    const resolved = path.resolve(dirPath);
    const stats = await fs.statfs(resolved);
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    return { used: Math.max(0, total - free), total };
  } catch {
    return null;
  }
}
