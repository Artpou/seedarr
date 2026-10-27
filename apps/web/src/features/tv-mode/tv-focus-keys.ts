import type { Media } from "@seedarr/sdk";

export function tvMediaFocusKey(media: Pick<Media, "id" | "type">): string {
  return `MEDIA-${media.type}-${media.id}`;
}

export function tvPlayFocusKey(downloadId: string): string {
  return `PLAY-${downloadId}`;
}

export function tvTorrentsFocusKey(mediaId: number | string): string {
  return `TORRENTS-${mediaId}`;
}

export function tvTorrentRowFocusKey(mediaId: number | string, rowId: string): string {
  return `TORRENT-ROW-${mediaId}-${rowId}`;
}

export function tvSeeMoreFocusKey(route: string, searchKey?: string): string {
  return `SEE_MORE-${route}${searchKey ? `-${searchKey}` : ""}`;
}

export function tvSeeMoreCarouselFocusKey(route: string, searchKey?: string): string {
  return `SEE_MORE-CAROUSEL-${route}${searchKey ? `-${searchKey}` : ""}`;
}

export const tvNavLibrarySearchFocusKey = "NAV-LIBRARY-SEARCH";

export function tvNavPrimaryFocusKey(mediaType: "movie" | "tv"): string {
  return mediaType === "movie" ? "NAV-/movies" : "NAV-/tv";
}

export function tvTrailerFocusKey(mediaType: "movie" | "tv", mediaId: number | string): string {
  return `TRAILER-${mediaType}-${mediaId}`;
}

export function tvRequestFocusKey(mediaId: number | string, mediaType: "movie" | "tv"): string {
  return `REQUEST-${mediaType}-${mediaId}`;
}

export function tvMediaLikeFocusKey(mediaId: number | string, mediaType: "movie" | "tv"): string {
  return `LIKE-${mediaType}-${mediaId}`;
}

export function tvMediaWatchlistFocusKey(mediaId: number | string, mediaType: "movie" | "tv"): string {
  return `WATCHLIST-${mediaType}-${mediaId}`;
}

export function tvMediaReviewFocusKey(mediaId: number | string, mediaType: "movie" | "tv"): string {
  return `REVIEW-${mediaType}-${mediaId}`;
}

export function tvMediaDetailTabFocusPrefix(mediaType: "movie" | "tv", mediaId: number | string): string {
  return `MEDIA-TAB-${mediaType}-${mediaId}`;
}

export function tvDetailInitialFocusKey(options: {
  mediaType: "movie" | "tv";
  mediaId: number | string;
  downloadId?: string;
  isViewer: boolean;
}): string {
  if (options.downloadId) return tvPlayFocusKey(options.downloadId);
  if (options.isViewer) return tvRequestFocusKey(options.mediaId, options.mediaType);
  return tvTorrentsFocusKey(options.mediaId);
}
