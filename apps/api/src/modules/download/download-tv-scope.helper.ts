import { parseSeasonEpisode, VIDEO_EXTENSIONS } from "@seedarr/shared";
import type WebTorrent from "webtorrent";

import { BadRequestError } from "@/shared/errors/error";
import { logger } from "@/shared/helpers/logger.helper";

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

export type TvScopeRequest = {
  season?: number;
  episode?: number;
  fullSeason?: boolean;
  mediaType: "movie" | "tv";
};

export function assertTvScopeForRequest(request: TvScopeRequest, tvScope: TvScope | null): TvScope | null {
  if (request.mediaType !== "tv" || request.season === undefined) {
    return tvScope;
  }
  if (request.episode === undefined && !request.fullSeason) {
    throw new BadRequestError("Select an episode or enable full-season download for TV torrents");
  }
  if (!tvScope?.wanted?.length) {
    throw new BadRequestError("No matching episode files in this torrent for the selected season or episode");
  }
  return tvScope;
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

/**
 * WebTorrent internals used for selective download hardening.
 * `_request` does not check `_selections` for BEP6 Allowed Fast pieces, so early
 * in a download peers can push random unselected pieces (see requestAllowedFastSet).
 */
type WtSelections = {
  length: number;
  get(index: number): { from: number; to: number } | undefined;
};

type WtTorrentInternal = WebTorrent.Torrent & {
  _selections?: WtSelections;
  _request?: (wire: unknown, index: number, hotswap?: boolean) => boolean;
  __seedarrSelectionGuard?: boolean;
};

type WtFileInternal = WebTorrent.TorrentFile & {
  _startPiece?: number;
  _endPiece?: number;
};

function pieceIsInSelections(torrent: WtTorrentInternal, index: number): boolean {
  const selections = torrent._selections;
  if (!selections?.length) return false;
  for (let i = 0; i < selections.length; i++) {
    const range = selections.get(i);
    if (range && index >= range.from && index <= range.to) return true;
  }
  return false;
}

/**
 * Block piece requests outside active `_selections`.
 * WebTorrent's Allowed Fast path (`requestAllowedFastSet`) calls `_request` with
 * arbitrary piece indexes while the peer is choking — ignoring file selection.
 * Install as early as possible (right after `client.add`) so the metadata→ready
 * window cannot leak bytes into non-wanted files.
 */
export function guardTorrentPieceRequests(torrent: WebTorrent.Torrent): void {
  const t = torrent as WtTorrentInternal;
  if (t.__seedarrSelectionGuard) return;
  const original = t._request;
  if (typeof original !== "function") return;

  t.__seedarrSelectionGuard = true;
  t._request = function seedarrGuardedRequest(wire: unknown, index: number, hotswap?: boolean) {
    if (!pieceIsInSelections(t, index)) return false;
    return original.call(this, wire, index, hotswap);
  };
}

/** Clear non-stream piece selections (merged ranges included). Keeps createReadStream selections. */
function clearTorrentSelections(torrent: WebTorrent.Torrent): void {
  const pieceCount = torrent.pieces?.length ?? 0;
  if (pieceCount > 0) {
    try {
      // Public API ignores the 3rd arg; @types/webtorrent still requires it.
      // Runtime only clears non-stream selections (isStreamSelection=false).
      torrent.deselect(0, pieceCount - 1, 0);
    } catch {
      // Piece API unavailable — fall through to per-file deselect.
    }
  }
  for (const file of torrent.files) {
    file.deselect();
  }
}

function selectTorrentFile(torrent: WebTorrent.Torrent, file: WebTorrent.TorrentFile): void {
  const f = file as WtFileInternal;
  if (typeof f._startPiece === "number" && typeof f._endPiece === "number") {
    torrent.select(f._startPiece, f._endPiece);
    return;
  }
  file.select();
}

export type ApplyTorrentFilePolicyOptions = {
  /**
   * When `tvScope.wanted` is empty/missing, select every file (movies / legacy restores).
   * Default **false**: leave the torrent deselected so a later null/undefined reapply
   * cannot undo a selective TV download (WebTorrent #1935).
   */
  selectAllIfEmpty?: boolean;
};

/**
 * WebTorrent file selection (see https://github.com/webtorrent/webtorrent/issues/1935):
 * add with `deselect: true`, then on `ready` clear selections and select only wanted files.
 *
 * Important: callers that may run with a missing scope (async DB reapply, handler ready
 * hooks) must omit `selectAllIfEmpty` so they never expand selection to the full pack.
 */
export function applyTorrentFilePolicy(
  torrent: WebTorrent.Torrent,
  tvScope: TvScope | null | undefined,
  options?: ApplyTorrentFilePolicyOptions,
): void {
  if (!torrent.ready) {
    throw new BadRequestError("Torrent not ready for episode file selection");
  }

  // Idempotent: also installed in safeAdd, but re-apply paths may attach an existing torrent.
  guardTorrentPieceRequests(torrent);
  clearTorrentSelections(torrent);

  const wanted = tvScope?.wanted;
  if (wanted?.length) {
    const indices = getTorrentFileIndicesForEpisodes(torrent, wanted);
    if (indices.length === 0) {
      throw new BadRequestError("No matching episode files in this torrent");
    }
    for (const index of indices) {
      const file = torrent.files[index];
      if (file) selectTorrentFile(torrent, file);
    }
    logger.info(
      "WEBTORRENT",
      `File policy selective: files=${torrent.files.length} wanted=${wanted.map(tvEpisodeKey).join(",")} selected=[${indices.join(",")}]`,
    );
    return;
  }

  if (options?.selectAllIfEmpty) {
    for (const file of torrent.files) {
      selectTorrentFile(torrent, file);
    }
    logger.info("WEBTORRENT", `File policy select-all: files=${torrent.files.length}`);
    return;
  }

  logger.debug(
    "WEBTORRENT",
    `File policy leave-deselected: files=${torrent.files.length} (no wanted scope; selectAllIfEmpty=false)`,
  );
}

export function buildTvScopeFromRequest(
  torrent: WebTorrent.Torrent,
  options: TvScopeRequest,
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
