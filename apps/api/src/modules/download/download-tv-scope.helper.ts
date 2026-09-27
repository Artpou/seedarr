import { parseSeasonEpisode, VIDEO_EXTENSIONS } from "@seedarr/shared";
import type WebTorrent from "webtorrent";

import { BadRequestError } from "@/shared/errors/error";

import type { TorrentLiveData, TvScope } from "./download.schema";

export type TvEpisodeRef = { season: number; episode: number };

function tvEpisodeKey(ep: TvEpisodeRef): string {
  return `${ep.season}-${ep.episode}`;
}

export function mergeTvEpisodes(existing: TvEpisodeRef[], add: TvEpisodeRef[]): TvEpisodeRef[] {
  const map = new Map<string, TvEpisodeRef>();
  for (const ep of [...existing, ...add]) {
    map.set(tvEpisodeKey(ep), ep);
  }
  return [...map.values()].sort((a, b) => a.season - b.season || a.episode - b.episode);
}

export function buildAvailableEpisodesFromTorrent(torrent: WebTorrent.Torrent): TvEpisodeRef[] {
  const seen = new Map<string, TvEpisodeRef>();
  for (const file of torrent.files) {
    if (!VIDEO_EXTENSIONS.test(file.name)) continue;
    const parsed = parseSeasonEpisode(file.name) ?? parseSeasonEpisode(file.path);
    if (!parsed) continue;
    seen.set(tvEpisodeKey(parsed), parsed);
  }
  return [...seen.values()].sort((a, b) => a.season - b.season || a.episode - b.episode);
}

export function resolveWantedEpisodes(
  available: TvEpisodeRef[],
  options: { season?: number; episode?: number; fullSeason?: boolean; mediaType: "movie" | "tv" },
): TvEpisodeRef[] | null {
  if (options.mediaType !== "tv") return null;
  const { season, episode, fullSeason } = options;
  if (season === undefined) return null;

  if (episode !== undefined) {
    const match = available.find((e) => e.season === season && e.episode === episode);
    return match ? [match] : [];
  }

  if (fullSeason) {
    return available.filter((e) => e.season === season);
  }

  return null;
}

function getTorrentFileIndicesForEpisodes(torrent: WebTorrent.Torrent, episodes: TvEpisodeRef[]): number[] {
  const wantedKeys = new Set(episodes.map(tvEpisodeKey));
  const indices: number[] = [];
  torrent.files.forEach((file, index) => {
    if (!VIDEO_EXTENSIONS.test(file.name)) return;
    const parsed = parseSeasonEpisode(file.name) ?? parseSeasonEpisode(file.path);
    if (parsed && wantedKeys.has(tvEpisodeKey(parsed))) indices.push(index);
  });
  return indices;
}

/** Deselect everything, then select wanted TV episodes or all files when there is no TV scope. */
export function applyTorrentFilePolicy(torrent: WebTorrent.Torrent, tvScope: TvScope | null | undefined): void {
  for (const file of torrent.files) file.deselect();

  const wanted = tvScope?.wanted;
  if (wanted?.length) {
    const indices = getTorrentFileIndicesForEpisodes(torrent, wanted);
    if (indices.length === 0) {
      throw new BadRequestError("No matching episode files in this torrent");
    }
    for (const index of indices) {
      torrent.files[index]?.select();
    }
    return;
  }

  for (const file of torrent.files) file.select();
}

export function buildTvScopeFromRequest(
  torrent: WebTorrent.Torrent,
  options: { season?: number; episode?: number; fullSeason?: boolean; mediaType: "movie" | "tv" },
  existingScope?: TvScope | null,
): TvScope | null {
  const available = buildAvailableEpisodesFromTorrent(torrent);
  if (available.length === 0) return existingScope ?? null;

  const requested = resolveWantedEpisodes(available, options);
  if (requested === null) return existingScope ?? null;
  if (requested.length === 0) {
    throw new BadRequestError("No matching episode in torrent for the selected season or episode");
  }

  const wanted = existingScope?.wanted?.length ? mergeTvEpisodes(existingScope.wanted, requested) : requested;

  return { available, wanted };
}

export function aggregateTorrentLiveDataForTvScope(
  base: TorrentLiveData,
  torrent: WebTorrent.Torrent,
  tvScope: TvScope | null | undefined,
): TorrentLiveData {
  if (!tvScope?.wanted?.length) {
    return tvScope ? { ...base, tvScope } : base;
  }

  const wantedIndices = new Set(getTorrentFileIndicesForEpisodes(torrent, tvScope.wanted));
  if (wantedIndices.size === 0) {
    return { ...base, tvScope };
  }

  let length = 0;
  let downloaded = 0;
  let allDone = true;

  for (const [index, file] of base.files.entries()) {
    if (!wantedIndices.has(index)) continue;
    length += file.length;
    downloaded += file.downloaded;
    if (file.progress < 1) allDone = false;
  }

  const progress = length > 0 ? downloaded / length : 0;

  return {
    ...base,
    tvScope,
    length,
    downloaded,
    progress,
    done: allDone && length > 0,
  };
}
