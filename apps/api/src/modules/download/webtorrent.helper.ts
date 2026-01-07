import type WebTorrent from "webtorrent";

import type { TorrentFileInfo, TorrentLiveData } from "./download.dto";

export function extractTorrentLiveData(torrent: WebTorrent.Torrent): TorrentLiveData {
  return {
    // Progress information
    progress: torrent.progress,
    done: torrent.done,
    paused: torrent.paused,

    // Transfer speeds (bytes/sec)
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,

    // Transfer amounts (bytes)
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    length: torrent.length,
    ratio: torrent.ratio,

    // Network information
    numPeers: torrent.numPeers,

    // Time estimation
    timeRemaining: torrent.timeRemaining,

    // Files in the torrent (without streams/buffers)
    files: extractTorrentFiles(torrent.files),
  };
}

export function extractTorrentFiles(files: WebTorrent.TorrentFile[]): TorrentFileInfo[] {
  return files.map((file) => ({
    name: file.name,
    path: file.path,
    length: file.length,
    downloaded: file.downloaded,
    progress: file.progress,
  }));
}

export function findLargestVideoFile(torrent: WebTorrent.Torrent): WebTorrent.TorrentFile | null {
  const videoExtensions = /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v)$/i;

  const videoFiles = torrent.files
    .filter((file) => videoExtensions.test(file.name))
    .sort((a, b) => b.length - a.length);

  return videoFiles[0] || null;
}
