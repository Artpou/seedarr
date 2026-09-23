import { buildOrganizedRemotePath, extractYearFromDate, formatError, parseSeasonEpisode } from "@seedarr/shared";

import { logger } from "@/shared/helpers/logger.helper";
import { resolveWithinDownloads } from "@/shared/helpers/path.helper";

import { downloadRepository } from "@/modules/download/download.repository";
import { mediaRepository } from "@/modules/media/media.repository";
import fs from "node:fs/promises";
import path from "node:path";

function assertSafePath(p: string, label: string): void {
  if (!p || p.includes("..") || p.split(path.sep).includes("..")) {
    throw new Error(`Unsafe ${label} path: ${p}`);
  }
}

/** Restore leading `/` lost by `buildOrganizedRemotePath` when base was absolute. */
function absoluteOrganizedPath(basePath: string, organized: string): string {
  if (path.isAbsolute(basePath) && !path.isAbsolute(organized)) {
    return path.resolve("/", organized);
  }
  return organized;
}

/**
 * Library base for this media type:
 * - typed path absolute → use it
 * - typed path relative → under HARDLINK_PATH
 * - no typed path → HARDLINK_PATH (root)
 * - nothing usable → null (hardlink off)
 */
export function resolveLibraryBase(mediaType: "movie" | "tv"): string | null {
  const rootRaw = process.env.HARDLINK_PATH?.trim() || "";
  const typed = (mediaType === "tv" ? process.env.HARDLINK_TV_PATH : process.env.HARDLINK_MOVIE_PATH)?.trim() || "";

  if (typed) {
    assertSafePath(typed, mediaType);
  }
  if (rootRaw) {
    assertSafePath(rootRaw, "HARDLINK_PATH");
    if (!path.isAbsolute(rootRaw)) {
      throw new Error(`HARDLINK_PATH must be absolute: ${rootRaw}`);
    }
  }

  let base: string | null = null;
  if (typed) {
    if (path.isAbsolute(typed)) {
      base = typed;
    } else if (rootRaw) {
      base = path.join(rootRaw, typed);
    } else {
      return null;
    }
  } else if (rootRaw) {
    base = rootRaw;
  } else {
    return null;
  }

  const resolved = path.resolve(base);
  if (!path.isAbsolute(resolved)) {
    throw new Error(`${mediaType} library path must be absolute: ${resolved}`);
  }
  if (rootRaw && typed && !path.isAbsolute(typed)) {
    const rootResolved = path.resolve(rootRaw);
    if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
      throw new Error(`Unsafe ${mediaType} path escapes HARDLINK_PATH: ${typed}`);
    }
  }
  return resolved;
}

async function hardlinkOrCopyOnExdev(src: string, dest: string): Promise<void> {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fs.unlink(dest);
  } catch {
    // dest may not exist
  }
  try {
    await fs.link(src, dest);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "EXDEV") {
      logger.warn("HARDLINK", `Cross-device link unsupported (${src} -> ${dest}); copying instead`);
      await fs.copyFile(src, dest);
      return;
    }
    throw err;
  }
}

async function hardlinkTree(localPath: string, targetDir: string): Promise<number> {
  const stats = await fs.stat(localPath);
  const files: { src: string; dest: string }[] = [];

  if (stats.isFile()) {
    files.push({ src: localPath, dest: path.join(targetDir, path.basename(localPath)) });
  } else {
    const entries = await fs.readdir(localPath, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const src = path.join(entry.parentPath || localPath, entry.name);
      const relative = path.relative(localPath, src);
      if (relative.includes("..")) {
        throw new Error(`Unsafe relative path under download: ${relative}`);
      }
      files.push({ src, dest: path.join(targetDir, relative) });
    }
  }

  for (const file of files) {
    await hardlinkOrCopyOnExdev(file.src, file.dest);
  }
  return files.length;
}

/**
 * Optional local-library hardlink via env only.
 * Enabled when HARDLINK_PATH and/or an absolute typed path is set.
 * Movie/TV overrides optional; default target base is HARDLINK_PATH (root).
 */
export async function tryLocalLibraryHardlink(downloadId: string, torrentName: string): Promise<void> {
  const dl = await downloadRepository.find(downloadId);
  const mediaId = dl?.mediaId;
  if (!mediaId) return;

  const mediaRow = await mediaRepository.find(mediaId);
  if (!mediaRow || (mediaRow.type !== "movie" && mediaRow.type !== "tv")) return;

  const basePath = resolveLibraryBase(mediaRow.type);
  if (!basePath) return;

  const parsed = parseSeasonEpisode(torrentName);
  const organized = buildOrganizedRemotePath({
    basePath,
    title: mediaRow.title,
    year: extractYearFromDate(mediaRow.release_date),
    type: mediaRow.type,
    season: mediaRow.type === "tv" ? (parsed?.season ?? null) : null,
  });
  const targetDir = absoluteOrganizedPath(basePath, organized);
  assertSafePath(targetDir, "hardlink target");

  const resolvedTarget = path.resolve(targetDir);
  if (resolvedTarget !== basePath && !resolvedTarget.startsWith(basePath + path.sep)) {
    throw new Error(`Hardlink target escapes library root: ${resolvedTarget}`);
  }

  const localPath = resolveWithinDownloads(torrentName);
  const count = await hardlinkTree(localPath, resolvedTarget);
  logger.info("HARDLINK", `Linked ${count} file(s) for "${torrentName}" -> ${resolvedTarget}`);
}

/** Awaitable wrapper: logs failures but does not throw (remote transfer may still run). */
export async function runLocalLibraryHardlink(downloadId: string, torrentName: string): Promise<void> {
  try {
    await tryLocalLibraryHardlink(downloadId, torrentName);
  } catch (err: unknown) {
    logger.error("HARDLINK", `Local hardlink failed for "${torrentName}": ${formatError(err)}`);
  }
}
