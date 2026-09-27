import { BadRequestError } from "@/shared/errors/error";

import path from "node:path";

export function getDownloadsRoot(): string {
  return path.resolve(process.env.DOWNLOADS_PATH || "./downloads");
}

export function getAvatarsRoot(): string {
  return path.resolve(process.env.AVATARS_PATH || path.join(getDownloadsRoot(), "..", "avatars"));
}

export function assertWithinDownloads(resolvedPath: string): void {
  const root = getDownloadsRoot();
  if (resolvedPath !== root && !resolvedPath.startsWith(root + path.sep)) {
    throw new BadRequestError("Path escapes download directory");
  }
}

type DownloadPathSource = {
  torrent?: {
    name?: string | null;
    path?: string | null;
    files?: { path: string }[] | null;
  } | null;
  remoteLocation?: string | null;
};

/** Local folder under DOWNLOADS_PATH: torrent name, or remoteLocation basename when torrent was cleared. */
export function getDownloadFolderName(download: DownloadPathSource): string | undefined {
  const fromTorrent = download.torrent?.name?.trim();
  if (fromTorrent) return fromTorrent;

  const remote = download.remoteLocation?.trim().replace(/\/+$/, "");
  if (!remote) return undefined;

  return remote.split("/").pop()?.trim() || undefined;
}

/**
 * Absolute on-disk folder for a download under DOWNLOADS_PATH (WebTorrent store root).
 * Uses torrent.path + first file segment when TV staging nests under a show folder.
 */
/** Paths to remove on disk when deleting a local torrent (most specific first). */
export function collectDownloadDeletePaths(download: DownloadPathSource): string[] {
  const paths = new Set<string>();
  const primary = resolveDownloadStagingPath(download);
  if (primary) paths.add(primary);

  const torrent = download.torrent;
  if (!torrent) return [...paths];

  const downloadsRoot = getDownloadsRoot();
  const storeBase = torrent.path ? path.resolve(torrent.path) : downloadsRoot;
  const withinDownloads = storeBase === downloadsRoot || storeBase.startsWith(`${downloadsRoot}${path.sep}`);
  if (!withinDownloads) return [...paths];

  if (storeBase !== downloadsRoot) {
    paths.add(storeBase);
  }

  for (const file of torrent.files ?? []) {
    const normalized = file.path.replace(/\\/g, "/");
    if (!normalized.includes("/")) continue;
    const top = normalized.split("/")[0];
    if (top) {
      try {
        paths.add(assertWithinDownloadsPath(path.join(storeBase, top)));
      } catch {
        // skip invalid
      }
    }
  }

  const torrentName = torrent.name?.trim();
  if (torrentName) {
    try {
      const byName = path.basename(storeBase) === torrentName ? storeBase : path.join(storeBase, torrentName);
      paths.add(assertWithinDownloadsPath(byName));
    } catch {
      // skip
    }
  }

  return [...paths].sort((a, b) => b.length - a.length);
}

function assertWithinDownloadsPath(resolvedPath: string): string {
  assertWithinDownloads(resolvedPath);
  return resolvedPath;
}

/** WebTorrent `client.add` path (TV: `downloads/Show (year)`; movies: downloads root). */
export function resolveTorrentStorePath(download: DownloadPathSource): string {
  const fromTorrentPath = download.torrent?.path?.trim();
  if (fromTorrentPath) {
    const resolved = path.isAbsolute(fromTorrentPath)
      ? path.resolve(fromTorrentPath)
      : path.resolve(getDownloadsRoot(), fromTorrentPath);
    return assertWithinDownloadsPath(resolved);
  }
  return getDownloadsRoot();
}

export function resolveDownloadStagingPath(download: DownloadPathSource): string | null {
  const torrent = download.torrent;
  if (torrent) {
    const downloadsRoot = getDownloadsRoot();
    const storeBase = torrent.path ? path.resolve(torrent.path) : downloadsRoot;
    const withinDownloads = storeBase === downloadsRoot || storeBase.startsWith(`${downloadsRoot}${path.sep}`);
    if (withinDownloads) {
      const firstFilePath = torrent.files?.[0]?.path?.replace(/\\/g, "/");
      if (firstFilePath?.includes("/")) {
        const topSegment = firstFilePath.split("/")[0];
        if (topSegment) {
          const diskRoot = path.join(storeBase, topSegment);
          try {
            assertWithinDownloads(diskRoot);
            return diskRoot;
          } catch {
            return null;
          }
        }
      }

      const name = torrent.name?.trim();
      if (name) {
        const diskRoot = path.basename(storeBase) === name ? storeBase : path.join(storeBase, name);
        try {
          assertWithinDownloads(diskRoot);
          return diskRoot;
        } catch {
          return null;
        }
      }
    }
  }

  const folderName = getDownloadFolderName(download);
  if (!folderName) return null;

  try {
    return resolveWithinDownloads(folderName);
  } catch {
    return null;
  }
}

export function requireDownloadFolderName(download: {
  torrent?: { name?: string | null } | null;
  remoteLocation?: string | null;
}): string {
  const name = getDownloadFolderName(download);
  if (!name) throw new BadRequestError("Download has no folder name");
  return name;
}

export function resolveWithinDownloads(...segments: string[]): string {
  const resolved = path.resolve(getDownloadsRoot(), ...segments);
  assertWithinDownloads(resolved);
  return resolved;
}

export function resolveWithinAvatars(...segments: string[]): string {
  const root = getAvatarsRoot();
  const resolved = path.resolve(root, ...segments);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new BadRequestError("Path escapes avatars directory");
  }
  return resolved;
}
