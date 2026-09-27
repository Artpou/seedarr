import { filenameParse } from "@ctrl/video-filename-parser";
import type { ManualSyncInput } from "@seedarr/contracts";
import {
  buildOrganizedRemotePath,
  extractYearFromDate,
  getVideoContainer,
  isVideoFile,
  parseSeasonEpisode,
} from "@seedarr/shared";

import { BadRequestError } from "@/shared/errors/error";
import { logger } from "@/shared/helpers/logger.helper";

import { downloadRepository } from "@/modules/download/download.repository";
import { isTransferInProgress } from "@/modules/download/remote/remote-transfer.helper";
import { mediaRepository } from "@/modules/media/media.repository";
import type { TMDBItem } from "@/modules/tmdb/tmdb.types";
import { getTmdbApiKey } from "@/modules/tmdb/tmdb-key.query";
import {
  fetchTmdbById,
  fetchTmdbByImdbId,
  searchTmdbByTitle,
  sleep,
  tmdbItemToMediaInsert,
} from "@/modules/tmdb/tmdb-resolve.helper";
import path from "node:path";
import { remoteStorageService, type SyncRoots } from "./remote-storage.service";

interface RemoteSyncError {
  name: string;
  path: string;
  type: "movie" | "tv";
}

export interface RemoteSyncResponse {
  synced: number;
  skipped: number;
  errors: RemoteSyncError[];
}

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;

const SKIP_DIRECTORY_NAMES = new Set([
  "freebox",
  "#recycle",
  "@eadir",
  "$recycle.bin",
  "system volume information",
  "lost+found",
  "tmp",
  "temp",
]);

const TMDB_ID_REGEX = /\{tmdb-(\d+)\}/i;
const IMDB_ID_REGEX = /\{imdb-(tt\d+)\}/i;
const IMDB_BARE_REGEX = /\b(tt\d{7,})\b/;

interface SyncEntry {
  name: string;
  remoteLocation: string;
  mediaType: "movie" | "tv";
  type: "file" | "directory";
  basePath: string;
}

interface TMDBMatch {
  item: TMDBItem;
  resolvedType: "movie" | "tv";
}

function isSyncableDir(name: string): boolean {
  if (!name || name === "." || name === "..") return false;
  if (name.startsWith(".")) return false;
  return !SKIP_DIRECTORY_NAMES.has(name.toLowerCase());
}

function extractTmdbId(name: string): number | null {
  const match = name.match(TMDB_ID_REGEX);
  return match ? Number.parseInt(match[1], 10) : null;
}

function extractImdbId(name: string): string | null {
  const match = name.match(IMDB_ID_REGEX) || name.match(IMDB_BARE_REGEX);
  return match ? match[1] : null;
}

function parseEntry(
  name: string,
  isTv: boolean,
): {
  title: string;
  year: number | null;
  seasons: number[];
  quality: string | null;
  language: string | null;
  container: string | null;
} {
  const parsed = filenameParse(name, isTv);

  let title = parsed.title;
  if (!title && isTv) {
    title = filenameParse(name, false).title;
  }
  if (!title) {
    title = name.replace(/[._-]/g, " ").replace(/\s+/g, " ").trim();
  }

  const year = parsed.year ? Number.parseInt(parsed.year, 10) : null;
  const seasons = isTv && "seasons" in parsed ? ((parsed.seasons as number[]) ?? []) : [];
  const quality = parsed.resolution ?? null;
  const language = parsed.languages?.[0] ?? null;
  const container = getVideoContainer(name);

  return { title, year, seasons, quality, language, container };
}

function getTmdbTitle(item: TMDBItem, type: "movie" | "tv"): string {
  return type === "movie" ? (item.title ?? item.name ?? "") : (item.name ?? item.title ?? "");
}

async function resolveTmdbMatch(name: string, mediaType: "movie" | "tv"): Promise<TMDBMatch | null> {
  const tmdbId = extractTmdbId(name);
  if (tmdbId) {
    const item = await fetchTmdbById(tmdbId, mediaType);
    if (item) return { item, resolvedType: mediaType };
  }

  const imdbId = extractImdbId(name);
  if (imdbId) {
    const found = await fetchTmdbByImdbId(imdbId);
    if (found) return { item: found.item, resolvedType: found.type };
  }

  const { title, year } = parseEntry(name, mediaType === "tv");
  if (title) {
    const item = await searchTmdbByTitle(title, year, mediaType);
    if (item) return { item, resolvedType: mediaType };
  }

  return null;
}

function organizedPath(entry: SyncEntry, tmdbItem: TMDBItem, resolvedType: "movie" | "tv", roots: SyncRoots): string {
  const releaseDate = resolvedType === "movie" ? tmdbItem.release_date : tmdbItem.first_air_date;
  const organized = buildOrganizedRemotePath({
    basePath: entry.basePath,
    title: getTmdbTitle(tmdbItem, resolvedType),
    year: extractYearFromDate(releaseDate),
    type: resolvedType,
    season: null,
  });
  return remoteStorageService.resolveOrganizedPath(roots, entry.basePath, organized);
}

async function countVideosUnder(roots: SyncRoots, dir: string, depth = 0): Promise<number> {
  if (depth > 2) return 0;
  const items = await remoteStorageService.listSyncChildren(roots, dir);
  let count = 0;
  for (const item of items) {
    if (item.type === "file" && isVideoFile(item.name)) count++;
    if (item.type === "directory") {
      count += await countVideosUnder(roots, remoteStorageService.joinSyncPath(roots, dir, item.name), depth + 1);
    }
  }
  return count;
}

async function inferSyncMediaType(
  roots: SyncRoots,
  entry: { name: string; remoteLocation: string; type: "file" | "directory" },
): Promise<"movie" | "tv"> {
  if (parseSeasonEpisode(entry.name)) return "tv";
  if (entry.type === "directory") {
    const videoCount = await countVideosUnder(roots, entry.remoteLocation);
    if (videoCount > 1) return "tv";
    const children = await remoteStorageService.listSyncChildren(roots, entry.remoteLocation);
    for (const child of children) {
      if (parseSeasonEpisode(child.name)) return "tv";
    }
  }
  return "movie";
}

async function collectEntriesWithInferredType(basePath: string, roots: SyncRoots): Promise<SyncEntry[]> {
  const base = remoteStorageService.normalizeSyncRoot(roots, basePath);
  if (!base) return [];

  const results: SyncEntry[] = [];
  try {
    const items = await remoteStorageService.listSyncChildren(roots, base);
    logger.info("REMOTE_SYNC", `shared path "${base}": ${items.length} entries (type inferred)`);

    for (const item of items) {
      const syncable =
        (item.type === "directory" && isSyncableDir(item.name)) || (item.type === "file" && isVideoFile(item.name));
      if (!syncable) continue;

      const remoteLocation = remoteStorageService.joinSyncPath(roots, base, item.name);
      const mediaType = await inferSyncMediaType(roots, {
        name: item.name,
        remoteLocation,
        type: item.type === "directory" ? "directory" : "file",
      });

      results.push({
        name: item.name,
        remoteLocation,
        mediaType,
        type: item.type === "directory" ? "directory" : "file",
        basePath: base,
      });
    }
  } catch (err) {
    logger.error("REMOTE_SYNC", `Failed to list shared directory "${base}": ${err}`);
  }
  return results;
}

async function collectEntries(basePath: string, mediaType: "movie" | "tv", roots: SyncRoots): Promise<SyncEntry[]> {
  const base = remoteStorageService.normalizeSyncRoot(roots, basePath);
  if (!base) return [];

  const results: SyncEntry[] = [];
  try {
    const items = await remoteStorageService.listSyncChildren(roots, base);
    logger.info("REMOTE_SYNC", `${mediaType} path "${base}": ${items.length} entries`);

    for (const item of items) {
      const syncable =
        (item.type === "directory" && isSyncableDir(item.name)) || (item.type === "file" && isVideoFile(item.name));
      if (!syncable) continue;

      results.push({
        name: item.name,
        remoteLocation: remoteStorageService.joinSyncPath(roots, base, item.name),
        mediaType,
        type: item.type === "directory" ? "directory" : "file",
        basePath: base,
      });
    }
  } catch (err) {
    logger.error("REMOTE_SYNC", `Failed to list ${mediaType} directory "${base}": ${err}`);
  }
  return results;
}

async function organizeFile(
  entry: SyncEntry,
  tmdbItem: TMDBItem,
  resolvedType: "movie" | "tv",
  roots: SyncRoots,
): Promise<void> {
  const targetDir = organizedPath(entry, tmdbItem, resolvedType, roots);
  try {
    await remoteStorageService.organizeSyncFile(roots, entry.remoteLocation, targetDir, entry.name);
    logger.info("REMOTE_SYNC", `Moved "${entry.name}" → "${targetDir}"`);
  } catch (err) {
    logger.error("REMOTE_SYNC", `Failed to organize file "${entry.name}": ${err}`);
  }
}

async function cleanupMissingRemoteLocations(
  downloads: Array<{
    id: string;
    remoteLocation: string | null;
    torrent: { done?: boolean; transferring?: boolean; paused?: boolean } | null;
  }>,
  roots: SyncRoots,
): Promise<Set<string>> {
  const removed = new Set<string>();

  for (const dl of downloads) {
    if (!dl.remoteLocation) continue;
    // Leave active torrents and mid-transfer rows alone.
    if (dl.torrent?.transferring || isTransferInProgress(dl.id)) continue;
    if (dl.torrent && (!dl.torrent.done || dl.torrent.paused)) continue;

    const exists = await remoteStorageService.syncPathExists(roots, dl.remoteLocation);
    if (exists) continue;

    logger.info("REMOTE_SYNC", `Removing orphan download ${dl.id} (missing path: ${dl.remoteLocation})`);
    await downloadRepository.deleteWithProgress(dl.id);
    removed.add(dl.id);
  }

  return removed;
}

export async function runRemoteSync(userId: string): Promise<RemoteSyncResponse> {
  const apiKey = await getTmdbApiKey();
  if (!apiKey) {
    throw new BadRequestError("TMDB API key is required for synchronization. Configure it in Settings > Modules.");
  }

  const roots = await remoteStorageService.getSyncRoots();
  logger.info("REMOTE_SYNC", `Scanning library (movies="${roots.moviePath}", tv="${roots.tvPath}")`);

  const existingDownloads = await downloadRepository.findManyWithMedia();
  const removedOrphans = await cleanupMissingRemoteLocations(existingDownloads, roots);
  if (removedOrphans.size > 0) {
    logger.info("REMOTE_SYNC", `Removed ${removedOrphans.size} orphan download(s) with missing library paths`);
  }

  const existingLocations = new Set<string>();
  const existingTitles = new Set<string>();

  for (const dl of existingDownloads) {
    if (removedOrphans.has(dl.id)) continue;
    if (!dl.remoteLocation) continue;
    // Only treat titles as "already in library" when a remote/library path is already linked.
    // Torrents hardlinked into Title (year) folders still need sync to attach remoteLocation.
    existingLocations.add(dl.remoteLocation.toLowerCase());
    const m = dl.media;
    if (m) {
      existingTitles.add(m.title.toLowerCase());
      if (m.original_title) existingTitles.add(m.original_title.toLowerCase());
    }
  }

  const entries: SyncEntry[] = [];
  const sharedLibraryRoot =
    roots.moviePath && roots.tvPath && roots.moviePath === roots.tvPath ? roots.moviePath : null;

  if (sharedLibraryRoot) {
    entries.push(...(await collectEntriesWithInferredType(sharedLibraryRoot, roots)));
  } else {
    if (roots.moviePath) entries.push(...(await collectEntries(roots.moviePath, "movie", roots)));
    if (roots.tvPath) entries.push(...(await collectEntries(roots.tvPath, "tv", roots)));
  }

  const uniqueEntries: SyncEntry[] = [];
  const seenLocations = new Set<string>();
  for (const entry of entries) {
    const key = entry.remoteLocation.toLowerCase();
    if (seenLocations.has(key)) continue;
    seenLocations.add(key);
    uniqueEntries.push(entry);
  }

  logger.info("REMOTE_SYNC", `Found ${uniqueEntries.length} entries to process (${entries.length} total before dedup)`);

  if (uniqueEntries.length === 0) {
    return { synced: 0, skipped: 0, errors: [] };
  }

  let synced = 0;
  let skipped = 0;
  const errors: RemoteSyncResponse["errors"] = [];
  const syncedMediaIds = new Set<number>();

  for (let i = 0; i < uniqueEntries.length; i += BATCH_SIZE) {
    const batch = uniqueEntries.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((entry) => processEntry(entry, userId, existingLocations, existingTitles, syncedMediaIds, roots)),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        if (result.value === "synced") synced++;
        else if (result.value === "skipped") skipped++;
        else errors.push({ name: batch[j].name, path: batch[j].remoteLocation, type: batch[j].mediaType });
      } else {
        logger.error("REMOTE_SYNC", `Error processing "${batch[j].name}": ${result.reason}`);
        errors.push({ name: batch[j].name, path: batch[j].remoteLocation, type: batch[j].mediaType });
      }
    }

    if (i + BATCH_SIZE < uniqueEntries.length) await sleep(BATCH_DELAY_MS);
  }

  logger.info("REMOTE_SYNC", `Completed: ${synced} synced, ${skipped} skipped, ${errors.length} errors`);
  return { synced, skipped, errors };
}

async function processEntry(
  entry: SyncEntry,
  userId: string,
  existingLocations: Set<string>,
  existingTitles: Set<string>,
  syncedMediaIds: Set<number>,
  roots: SyncRoots,
): Promise<"synced" | "skipped" | "not_found"> {
  const { name, remoteLocation, mediaType, type } = entry;

  if (existingLocations.has(remoteLocation.toLowerCase())) return "skipped";

  const { title, quality, language, container } = parseEntry(name, mediaType === "tv");
  if (title && existingTitles.has(title.toLowerCase())) return "skipped";

  const match = await resolveTmdbMatch(name, mediaType);
  if (!match?.item?.id) return "not_found";

  const { item: tmdbItem, resolvedType } = match;
  const mediaInsert = tmdbItemToMediaInsert(tmdbItem, resolvedType);

  if (syncedMediaIds.has(tmdbItem.id)) {
    if (type === "file") await organizeFile(entry, tmdbItem, resolvedType, roots);
    return "skipped";
  }

  const existingDls = await downloadRepository.findByMediaId(tmdbItem.id);

  if (existingDls.length > 0) {
    const needsUpdate = existingDls.some((dl) => !dl.remoteLocation);
    if (needsUpdate) {
      const targetLocation = type === "file" ? organizedPath(entry, tmdbItem, resolvedType, roots) : remoteLocation;
      for (const dl of existingDls) {
        if (!dl.remoteLocation) {
          await downloadRepository.update(dl.id, {
            remoteLocation: targetLocation,
            moduleStorageId: roots.storageModuleId,
          });
        }
      }
      await mediaRepository.upsert(mediaInsert);
    }

    if (type === "file") await organizeFile(entry, tmdbItem, resolvedType, roots);

    syncedMediaIds.add(tmdbItem.id);
    existingTitles.add(mediaInsert.title.toLowerCase());
    if (mediaInsert.original_title) existingTitles.add(mediaInsert.original_title.toLowerCase());
    return needsUpdate ? "synced" : "skipped";
  }

  if (type === "file") await organizeFile(entry, tmdbItem, resolvedType, roots);

  const downloadLocation = type === "file" ? organizedPath(entry, tmdbItem, resolvedType, roots) : remoteLocation;

  await mediaRepository.upsert(mediaInsert);

  await downloadRepository.insert({
    userId,
    mediaId: tmdbItem.id,
    origin: "remote-sync",
    quality,
    language,
    container,
    remoteLocation: downloadLocation,
    moduleStorageId: roots.storageModuleId,
    size: await remoteStorageService.sumSyncVideoBytes(roots, downloadLocation),
    torrent: null,
  });

  syncedMediaIds.add(tmdbItem.id);
  existingLocations.add(downloadLocation.toLowerCase());
  existingTitles.add(mediaInsert.title.toLowerCase());
  if (mediaInsert.original_title) existingTitles.add(mediaInsert.original_title.toLowerCase());

  return "synced";
}

export async function runManualSync(userId: string, input: ManualSyncInput): Promise<{ success: true }> {
  const apiKey = await getTmdbApiKey();
  if (!apiKey) throw new BadRequestError("TMDB API key is required");

  const tmdbItem = await fetchTmdbById(input.mediaId, input.type);
  if (!tmdbItem) throw new BadRequestError("Could not find media on TMDB");

  const roots = await remoteStorageService.getSyncRoots();
  const mediaInsert = tmdbItemToMediaInsert(tmdbItem, input.type);
  await mediaRepository.upsert(mediaInsert);

  const configuredBase = input.type === "tv" ? roots.tvPath : roots.moviePath;
  const basePath = remoteStorageService.normalizeSyncRoot(roots, configuredBase);
  const fileName = path.basename(input.remotePath.replace(/\\/g, "/"));
  const { quality, language, container } = parseEntry(fileName, input.type === "tv");
  const entry: SyncEntry = {
    name: fileName,
    remoteLocation: input.remotePath,
    mediaType: input.type,
    type: isVideoFile(fileName) ? "file" : "directory",
    basePath,
  };

  const downloadLocation = entry.type === "file" ? organizedPath(entry, tmdbItem, input.type, roots) : input.remotePath;

  const existing = await downloadRepository.findByMediaIdAndRemoteLocations(input.mediaId, [
    downloadLocation,
    input.remotePath,
  ]);

  if (entry.type === "file") {
    await organizeFile(entry, tmdbItem, input.type, roots);
  }

  if (!existing) {
    await downloadRepository.insert({
      userId,
      mediaId: input.mediaId,
      origin: "remote-sync",
      quality,
      language,
      container,
      remoteLocation: downloadLocation,
      moduleStorageId: roots.storageModuleId,
      size: await remoteStorageService.sumSyncVideoBytes(roots, downloadLocation),
      torrent: null,
    });
  }

  return { success: true };
}
