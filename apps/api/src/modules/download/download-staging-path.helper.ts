import { buildOrganizedRemotePath, extractYearFromDate } from "@seedarr/shared";

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
