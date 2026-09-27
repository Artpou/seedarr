import type { Download } from "@seedarr/sdk";
import { parseSeasonEpisode } from "@seedarr/shared";

export type RemoteFileLike = {
  name: string;
  path?: string;
};

function episodeKey(season: number, episode: number): string {
  return `${season}-${episode}`;
}

export type CoveredEpisode = {
  season: number;
  episode: number;
};

function addEpisodeRef(map: Map<string, Download>, download: Download, season: number, episode: number): void {
  const key = episodeKey(season, episode);
  if (!map.has(key)) map.set(key, download);
}

function addParsed(map: Map<string, Download>, download: Download, text?: string | null): void {
  if (!text) return;
  const parsed = parseSeasonEpisode(text);
  if (!parsed) return;
  addEpisodeRef(map, download, parsed.season, parsed.episode);
}

export function buildEpisodeDownloadMap(
  downloads: Download[],
  remoteFilesByDownloadId: Map<string, RemoteFileLike[]> = new Map(),
): Map<string, Download> {
  const map = new Map<string, Download>();

  for (const download of downloads) {
    const tvScope = download.torrent?.tvScope;
    if (tvScope?.wanted?.length) {
      for (const ep of tvScope.wanted) {
        addEpisodeRef(map, download, ep.season, ep.episode);
      }
      for (const file of remoteFilesByDownloadId.get(download.id) ?? []) {
        addParsed(map, download, file.name);
        addParsed(map, download, file.path);
      }
      continue;
    }

    addParsed(map, download, download.torrent?.name);
    addParsed(map, download, download.remoteLocation);

    for (const file of download.torrent?.files ?? []) {
      addParsed(map, download, file.name);
      addParsed(map, download, file.path);
    }

    for (const file of remoteFilesByDownloadId.get(download.id) ?? []) {
      addParsed(map, download, file.name);
      addParsed(map, download, file.path);
    }
  }

  return map;
}

export function getEpisodesCoveredByDownload(
  downloadId: string,
  episodeDownloadMap: Map<string, Download>,
): CoveredEpisode[] {
  const episodes: CoveredEpisode[] = [];

  for (const [key, download] of episodeDownloadMap) {
    if (download.id !== downloadId) continue;

    const [season, episode] = key.split("-").map(Number);
    if (!Number.isFinite(season) || !Number.isFinite(episode)) continue;
    episodes.push({ season, episode });
  }

  return episodes.sort((a, b) => a.season - b.season || a.episode - b.episode);
}

export function isEpisodeWantedByDownload(download: Download, season: number, episode: number): boolean {
  const wanted = download.torrent?.tvScope?.wanted;
  if (wanted?.length) {
    return wanted.some((ep) => ep.season === season && ep.episode === episode);
  }
  return true;
}

export function inferEpisodeFromDownload(
  download: Download,
  remoteFiles: RemoteFileLike[] = [],
): CoveredEpisode | null {
  const map = buildEpisodeDownloadMap([download], new Map([[download.id, remoteFiles]]));
  const covered = getEpisodesCoveredByDownload(download.id, map);
  if (covered.length === 1) return covered[0] ?? null;
  return parseSeasonEpisode(download.torrent?.name ?? "") ?? parseSeasonEpisode(download.remoteLocation ?? "") ?? null;
}
