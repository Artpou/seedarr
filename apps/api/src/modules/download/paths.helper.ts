import { buildOrganizedRemotePath, extractYearFromDate, VIDEO_EXTENSIONS } from "@seedarr/shared";

import { getDownloadFolderName, resolveDownloadStagingPath } from "@/shared/helpers/path.helper";
import { findLargestVideoInDirectory } from "@/shared/helpers/video-file.helper";

import type { Download } from "@/modules/download/download.schema";
import {
  absoluteOrganizedPath,
  getHardlinkTargetDir,
  listLibraryBaseCandidates,
} from "@/modules/download/local/local-library-hardlink";
import { mediaRepository } from "@/modules/media/media.repository";
import { moduleRepository } from "@/modules/module/module.repository";
import { remoteStorageService } from "@/modules/storage-config/remote/remote-storage.service";
import { isFsNotFoundError } from "@/modules/streaming/streaming.helper";
import fs from "node:fs/promises";
import path from "node:path";

/** Same layout as sync / hardlink / remote transfer (`Title (year)` for TV — no season subfolder). */
export function getOrganizedMediaRelativePath(
  media: { type: "movie" | "tv"; title: string; release_date: string | null },
  _torrentLabel: string,
  basePath: string,
): string {
  return buildOrganizedRemotePath({
    basePath,
    title: media.title,
    year: extractYearFromDate(media.release_date),
    type: media.type,
    season: null,
  });
}

/** Relative path under DOWNLOADS_PATH for a TV download (`Show (year)`), or null for movies. */
export function getTvDownloadsFolder(
  media: { type: string; title: string; release_date: string | null },
  _torrentLabel: string,
): string | null {
  if (media.type !== "tv") return null;
  return getOrganizedMediaRelativePath(
    { type: "tv", title: media.title, release_date: media.release_date },
    _torrentLabel,
    "",
  );
}

/** Target remote folder for a download (set at start when remote storage is enabled). */
export async function getPlannedRemoteDownloadFields(
  media: { id: number; type: string; title: string; release_date: string | null },
  torrentLabel: string,
): Promise<Pick<Download, "remoteLocation" | "moduleStorageId"> | null> {
  if (!(await remoteStorageService.isEnabled())) return null;

  const mediaRow = await mediaRepository.find(media.id);
  const paths = await remoteStorageService.getMediaPaths();
  const storageModuleId = await moduleRepository.getEnabledStorageModuleId();
  if (!storageModuleId) return null;

  if (!mediaRow || (mediaRow.type !== "movie" && mediaRow.type !== "tv")) {
    const remotePath = await remoteStorageService.resolveTransferPath(torrentLabel, null);
    return { remoteLocation: remotePath, moduleStorageId: storageModuleId };
  }

  const basePath = mediaRow.type === "tv" ? paths.tvPath : paths.moviePath;
  const remotePath = getOrganizedMediaRelativePath(mediaRow, torrentLabel, basePath);
  return { remoteLocation: remotePath, moduleStorageId: storageModuleId };
}

export type ResolvedLocalVideo = {
  filePath: string;
  fileName: string;
  size: number;
};

/** Ordered directories to search for video files (library paths before staging). */
export async function listDownloadVideoSearchDirs(download: Download): Promise<string[]> {
  const folderName = getDownloadFolderName(download);
  if (!folderName) return [];

  const dirs: string[] = [];
  const mediaId = download.mediaId;

  if (mediaId) {
    const mediaRow = await mediaRepository.find(mediaId);
    if (mediaRow && (mediaRow.type === "movie" || mediaRow.type === "tv")) {
      const primaryTarget = getHardlinkTargetDir(mediaRow, folderName);
      if (primaryTarget) dirs.push(primaryTarget);

      for (const base of listLibraryBaseCandidates(mediaRow.type)) {
        const organized = buildOrganizedRemotePath({
          basePath: base,
          title: mediaRow.title,
          year: extractYearFromDate(mediaRow.release_date),
          type: mediaRow.type,
          season: null,
        });
        const candidate = path.resolve(absoluteOrganizedPath(base, organized));
        if (!dirs.includes(candidate)) dirs.push(candidate);
      }
    }
  }

  const staging = resolveDownloadStagingPath(download);
  if (staging && !dirs.includes(staging)) dirs.push(staging);

  return dirs;
}

async function resolveVideoAtPath(fullPath: string): Promise<ResolvedLocalVideo | null> {
  try {
    const stats = await fs.stat(fullPath);
    if (stats.isFile()) {
      const fileName = path.basename(fullPath);
      if (!VIDEO_EXTENSIONS.test(fileName)) return null;
      return { filePath: fullPath, fileName, size: stats.size };
    }

    const largest = await findLargestVideoInDirectory(fullPath);
    if (!largest || largest.size <= 0) return null;
    return { filePath: largest.filePath, fileName: largest.fileName, size: largest.size };
  } catch (error) {
    if (isFsNotFoundError(error)) return null;
    throw error;
  }
}

/** Resolve largest local video: HARDLINK typed path → HARDLINK root → DOWNLOADS staging. */
export async function resolveDownloadLocalVideo(download: Download): Promise<ResolvedLocalVideo | null> {
  const searchDirs = await listDownloadVideoSearchDirs(download);
  for (const dir of searchDirs) {
    const resolved = await resolveVideoAtPath(dir);
    if (resolved) return resolved;
  }
  return null;
}

type DownloadFileEntry = { name: string; path: string; length: number };

async function listVideosInDir(dir: string, prefix = ""): Promise<DownloadFileEntry[]> {
  const entries: DownloadFileEntry[] = [];
  let dirents: import("node:fs").Dirent[];
  try {
    dirents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const dirent of dirents) {
    const rel = prefix ? `${prefix}/${dirent.name}` : dirent.name;
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      entries.push(...(await listVideosInDir(full, rel)));
      continue;
    }
    if (!VIDEO_EXTENSIONS.test(dirent.name)) continue;
    const stats = await fs.stat(full);
    entries.push({ name: dirent.name, path: rel, length: stats.size });
  }

  return entries;
}

/** Torrent file list while active; otherwise videos under the download folder on disk. */
async function resolveDownloadFiles(download: Download): Promise<DownloadFileEntry[]> {
  const torrentFiles = download.torrent?.files;
  if (Array.isArray(torrentFiles) && torrentFiles.length > 0) {
    return torrentFiles.map((f) => ({
      name: f.name,
      path: f.path,
      length: f.length,
      downloaded: f.downloaded ?? f.length,
      progress: f.progress ?? 1,
    }));
  }

  const dirs = await listDownloadVideoSearchDirs(download);
  for (const dir of dirs) {
    const files = await listVideosInDir(dir);
    if (files.length > 0) return files;
  }

  return [];
}

export type DownloadWithFiles = Download & { files?: DownloadFileEntry[] };

export async function enrichDownloadWithFiles(download: Download): Promise<DownloadWithFiles> {
  if (download.torrent?.files?.length) return download;

  const files = await resolveDownloadFiles(download);
  if (files.length === 0) return download;

  if (download.torrent) {
    const torrentFiles = files.map((f) => ({
      ...f,
      downloaded: f.length,
      progress: 1,
    }));
    return { ...download, torrent: { ...download.torrent, files: torrentFiles } };
  }

  return { ...download, files };
}
