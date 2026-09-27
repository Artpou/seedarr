import type { Torrent } from "@seedarr/sdk";
import { parseInfoHashFromMagnet } from "@seedarr/shared";

export function getTorrentUri(torrent: Torrent): string {
  if (torrent.downloadUrl) return torrent.downloadUrl;
  if (torrent.link?.startsWith("http://") || torrent.link?.startsWith("https://")) return torrent.link;
  if (torrent.magnetUrl?.includes("tr=")) return torrent.magnetUrl;
  if (torrent.guid?.startsWith("magnet:") && torrent.guid.includes("tr=")) return torrent.guid;
  if (torrent.magnetUrl) return torrent.magnetUrl;
  if (torrent.guid?.startsWith("magnet:")) return torrent.guid;
  return torrent.link ?? torrent.magnetUrl ?? torrent.guid ?? "";
}

export function getTorrentInfoHash(torrent: Torrent): string | null {
  const fromGuid = torrent.guid ? parseInfoHashFromMagnet(torrent.guid) : null;
  if (fromGuid) return fromGuid;
  const uri = getTorrentUri(torrent);
  return parseInfoHashFromMagnet(uri);
}

export function buildExistingInfoHashSet(downloads: { torrent?: { infoHash?: string } | null }[]): Set<string> {
  const hashes = new Set<string>();
  for (const download of downloads) {
    const hash = download.torrent?.infoHash?.toLowerCase();
    if (hash) hashes.add(hash);
  }
  return hashes;
}
