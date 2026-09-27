import { VIDEO_EXTENSIONS } from "@seedarr/shared";

import type { Download } from "@/modules/download/download.schema";
import { listDownloadVideoSearchDirs } from "@/modules/download/download-local-video-path.helper";
import fs from "node:fs/promises";
import path from "node:path";

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
