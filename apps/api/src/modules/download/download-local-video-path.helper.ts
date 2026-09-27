import { buildOrganizedRemotePath, extractYearFromDate, VIDEO_EXTENSIONS } from "@seedarr/shared";

import { getDownloadFolderName, resolveDownloadStagingPath } from "@/shared/helpers/path.helper";
import { findLargestVideoInDirectory } from "@/shared/helpers/video-file.helper";

import type { Download } from "@/modules/download/download.schema";
import {
  absoluteOrganizedPath,
  getHardlinkTargetDir,
  listLibraryBaseCandidates,
} from "@/modules/download/local-library-hardlink";
import { mediaRepository } from "@/modules/media/media.repository";
import { isFsNotFoundError } from "@/modules/streaming/streaming.helper";
import fs from "node:fs/promises";
import path from "node:path";

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
