import { t } from "@lingui/core/macro";
import type { Paginate } from "@seedarr/contracts";
import type { Media } from "@seedarr/sdk";
import type { InfiniteData } from "@tanstack/react-query";
import type { LinkOptions } from "@tanstack/react-router";

export type PosterFormat = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";

export function getPosterUrl(path?: string | null, format: PosterFormat = "w342"): string {
  if (!path) return "";

  if (path.includes("https")) {
    return path;
  }

  return `https://image.tmdb.org/t/p/${format}${path}`;
}

export type BackdropFormat = "w300" | "w780" | "w1280" | "original";

export function getBackdropUrl(path?: string | null, format: BackdropFormat = "original"): string | undefined {
  if (!path) return undefined;

  if (path.includes("https")) {
    return path;
  }

  return `https://image.tmdb.org/t/p/${format}${path}`;
}

export function getMediaType(type?: unknown): Media["type"] | undefined {
  if (!type || typeof type !== "string") return undefined;
  if (type === "tv") return "tv";
  if (type === "movie") return "movie";
  return undefined;
}

export function getWatchProgressPercent(media: Media): number {
  if (media.progress?.position == null || !media.progress.duration) return 0;
  return Math.min(100, (media.progress.position / media.progress.duration) * 100);
}

export function hasWatchProgress(media: Media): boolean {
  return (
    media.progress != null &&
    media.progress.position > 0 &&
    media.progress.duration > 0 &&
    media.progress.position / media.progress.duration < 0.95
  );
}

/** Watched when completed flag is set or progress ≥ 95%. */
export function isMediaWatched(media: {
  progress?: { position: number; duration: number; completed?: boolean | null } | null | undefined;
}): boolean {
  const progress = media.progress;
  if (!progress) return false;
  if (progress.completed) return true;
  if (progress.duration <= 0) return false;
  return progress.position / progress.duration >= 0.95;
}

export function getRemainingTime(media: Media): string | null {
  let remainingSeconds: number | null = null;

  if (media.progress?.duration) {
    remainingSeconds = media.progress.duration - media.progress.position;
  } else if (media.duration && media.duration > 0) {
    remainingSeconds = media.duration * 60;
  }

  if (!remainingSeconds || remainingSeconds <= 0) return null;
  const totalMinutes = Math.ceil(remainingSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const suffix = totalMinutes > 1 ? t`remaining` : t`remaining`;

  if (hours > 0) {
    const formattedMinutes = minutes > 0 ? minutes.toString().padStart(2, "0") : "";
    return `${hours}h${formattedMinutes} ${suffix}`;
  }

  return `${minutes} minute${minutes > 1 ? "s" : ""} ${suffix}`;
}

export function isActiveDownload(download: Media["download"]): boolean {
  if (!download?.torrent) return false;
  if (download.torrent.transferring) return true;
  return !download.torrent.done && !download.torrent.paused;
}

function hasStartedWatching(media: Media): boolean {
  return (media.progress?.position ?? 0) > 0;
}

/** Primary navigation for library cards: play when a download exists, otherwise media detail. */
export function getMediaCardLinkOptions(media: Media, options?: { tvMode?: boolean }): LinkOptions {
  const tvSearch = options?.tvMode ? ({ mode: "tv" } as const) : undefined;
  const downloadId = media.download?.id;
  if (downloadId) {
    return {
      to: "/downloads/$id/play",
      params: { id: downloadId },
      ...(tvSearch ? { search: tvSearch } : {}),
    } as LinkOptions;
  }
  return {
    to: media.type === "tv" ? "/tv/$id" : "/movies/$id",
    params: { id: String(media.id) },
    ...(tvSearch ? { search: tvSearch } : {}),
  } as LinkOptions;
}

/** Discover “Downloaded” carousel: in-progress first, then active torrents, then the rest. */
export function sortDownloadedLibraryCarousel(medias: Media[]): Media[] {
  const rank = (media: Media): number => {
    if (hasStartedWatching(media)) return 0;
    if (isActiveDownload(media.download)) return 1;
    return 2;
  };

  return [...medias]
    .map((media, index) => ({ media, index, rank: rank(media) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ media }) => media);
}

export function hasActiveDownload(data: InfiniteData<Paginate<Media>>): boolean {
  return data.pages.some((page) => page.results.some((media) => isActiveDownload(media.download)));
}
