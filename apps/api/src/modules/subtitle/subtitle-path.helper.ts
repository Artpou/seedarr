import { isSubtitleFile } from "@seedarr/shared";

import { getDownloadFolderName, getDownloadsRoot, resolveWithinDownloads } from "@/shared/helpers/path.helper";

import type { Download } from "@/modules/download/download.schema";
import { listDownloadVideoSearchDirs } from "@/modules/download/download-local-video-path.helper";
import fs from "node:fs/promises";
import * as path from "node:path";

/** Absolute candidate paths for a subtitle file (library dirs, then staging). */
export async function resolveSubtitleFileCandidates(download: Download, rawFilePath: string): Promise<string[]> {
  const filePath = decodeURIComponent(rawFilePath);
  const candidates: string[] = [];
  const searchDirs = await listDownloadVideoSearchDirs(download);

  for (const root of searchDirs) {
    candidates.push(path.join(root, filePath));
    const base = path.basename(filePath);
    if (base !== filePath) candidates.push(path.join(root, base));
  }

  candidates.push(resolveWithinDownloads(filePath));
  const folderName = getDownloadFolderName(download);
  if (folderName && !filePath.startsWith(`${folderName}/`) && filePath !== folderName) {
    candidates.push(resolveWithinDownloads(folderName, filePath));
  }

  return [...new Set(candidates)];
}

/** List subtitle files on disk that are not already listed in torrent.files. */
export async function listExternalSubtitlePaths(download: Download): Promise<string[]> {
  const searchDirs = await listDownloadVideoSearchDirs(download);
  if (searchDirs.length === 0) return [];

  const downloadsRoot = getDownloadsRoot();
  const folderName = getDownloadFolderName(download);
  const torrentPaths = new Set(
    (download.torrent?.files ?? [])
      .filter((f) => isSubtitleFile(f.path))
      .map((f) => path.join(folderName ?? "", f.path).replace(/\\/g, "/")),
  );

  const collected: string[] = [];
  const scan = async (dir: string, relPrefix: string): Promise<void> => {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scan(full, relPrefix ? `${relPrefix}/${entry.name}` : entry.name);
        continue;
      }
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const normalized = rel.replace(/\\/g, "/");
      if (isSubtitleFile(entry.name) && !torrentPaths.has(normalized)) collected.push(normalized);
    }
  };

  for (const folderPath of searchDirs) {
    const relRoot = folderPath.startsWith(downloadsRoot)
      ? path.relative(downloadsRoot, folderPath).replace(/\\/g, "/")
      : "";
    await scan(folderPath, relRoot);
  }

  return collected;
}
