import { isSubtitleFile, parseSeasonEpisode } from "@seedarr/shared";

import { getDownloadFolderName, getDownloadsRoot, resolveWithinDownloads } from "@/shared/helpers/path.helper";

import type { Download } from "@/modules/download/download.schema";
import {
  listDownloadVideoSearchDirs,
  type PlaybackEpisodeScope,
  type ResolvedLocalVideo,
  resolveDownloadLocalVideo,
} from "@/modules/download/paths.helper";
import fs from "node:fs/promises";
import * as path from "node:path";

/** Strip accidental `downloads/` prefix and normalize slashes (torrent + request paths). */
export function normalizeSubtitleRelativePath(rawFilePath: string): string {
  let filePath = rawFilePath.replace(/\\/g, "/").trim();
  try {
    filePath = decodeURIComponent(filePath);
  } catch {
    // already decoded (Hono path param)
  }
  if (filePath.startsWith("downloads/")) {
    filePath = filePath.slice("downloads/".length);
  }
  return filePath;
}

/** Absolute candidate paths for a subtitle file (library dirs, then staging). */
export async function resolveSubtitleFileCandidates(download: Download, rawFilePath: string): Promise<string[]> {
  const filePath = normalizeSubtitleRelativePath(rawFilePath);
  const candidates: string[] = [];
  const searchDirs = await listDownloadVideoSearchDirs(download);
  const folderName = getDownloadFolderName(download);

  for (const root of searchDirs) {
    candidates.push(path.join(root, filePath));
    const base = path.basename(filePath);
    if (base !== filePath) candidates.push(path.join(root, base));
  }

  candidates.push(resolveWithinDownloads(filePath));
  if (folderName && !filePath.startsWith(`${folderName}/`) && filePath !== folderName) {
    candidates.push(resolveWithinDownloads(folderName, filePath));
  }

  return [...new Set(candidates)];
}

function subtitleRelativePathMatchesEpisode(
  relativePath: string,
  video: ResolvedLocalVideo,
  scope: { season: number; episode: number },
): boolean {
  const parsed = parseSeasonEpisode(relativePath);
  if (parsed) {
    return parsed.season === scope.season && parsed.episode === scope.episode;
  }

  const videoBase = path.basename(video.fileName, path.extname(video.fileName));
  const subBase = path.basename(relativePath).replace(/\.(srt|vtt|ass|ssa)$/i, "");
  if (subBase === videoBase || subBase.startsWith(`${videoBase}.`)) {
    return true;
  }

  const downloadsRoot = getDownloadsRoot();
  const videoDirRel = path.relative(downloadsRoot, path.dirname(video.filePath)).replace(/\\/g, "/");
  const subDir = relativePath.includes("/") ? relativePath.slice(0, relativePath.lastIndexOf("/")) : "";
  return subDir === videoDirRel;
}

/** List side-loaded subtitle files on disk (includes paths also present in torrent metadata). */
export async function listExternalSubtitlePaths(download: Download, scope?: PlaybackEpisodeScope): Promise<string[]> {
  const searchDirs = await listDownloadVideoSearchDirs(download);
  if (searchDirs.length === 0) return [];

  const downloadsRoot = getDownloadsRoot();
  const collected: string[] = [];
  const seen = new Set<string>();

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
      if (!isSubtitleFile(entry.name)) continue;
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const normalized = rel.replace(/\\/g, "/");
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      collected.push(normalized);
    }
  };

  for (const folderPath of searchDirs) {
    const relRoot = folderPath.startsWith(downloadsRoot)
      ? path.relative(downloadsRoot, folderPath).replace(/\\/g, "/")
      : "";
    await scan(folderPath, relRoot);
  }

  if (scope?.season != null && scope.episode != null) {
    const video = await resolveDownloadLocalVideo(download, scope);
    if (!video) return [];
    const episodeScope = { season: scope.season, episode: scope.episode };
    return collected.filter((relativePath) => subtitleRelativePathMatchesEpisode(relativePath, video, episodeScope));
  }

  return collected;
}
