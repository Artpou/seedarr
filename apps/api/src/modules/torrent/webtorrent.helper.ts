/**
 * WebTorrent Helper Functions
 *
 * Utility functions for working with WebTorrent instances
 * and extracting serializable data from Torrent objects.
 */

import type WebTorrent from "webtorrent";

import type { TorrentFileInfo, TorrentLiveData } from "./torrent.dto";

/**
 * Extract serializable live data from a WebTorrent.Torrent instance
 * This avoids circular references and non-JSON-safe properties (streams, buffers, etc.)
 *
 * @param torrent - The WebTorrent.Torrent instance
 * @returns Serializable torrent data safe for JSON transmission
 */
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

/**
 * Extract serializable file information from WebTorrent.TorrentFile objects
 * Removes non-serializable properties like streams and buffers
 *
 * @param files - Array of WebTorrent.TorrentFile instances
 * @returns Array of serializable file information
 */
export function extractTorrentFiles(files: WebTorrent.TorrentFile[]): TorrentFileInfo[] {
  return files.map((file) => ({
    name: file.name,
    path: file.path,
    length: file.length,
    downloaded: file.downloaded,
    progress: file.progress,
  }));
}

/**
 * Find the largest video file in a torrent
 * Useful for streaming the main video content
 *
 * @param torrent - The WebTorrent.Torrent instance
 * @returns The largest video file or null if no video files found
 */
export function findLargestVideoFile(torrent: WebTorrent.Torrent): WebTorrent.TorrentFile | null {
  const videoExtensions = /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v)$/i;

  const videoFiles = torrent.files
    .filter((file) => videoExtensions.test(file.name))
    .sort((a, b) => b.length - a.length);

  return videoFiles[0] || null;
}

/**
 * Check if a torrent is actively downloading
 *
 * @param torrent - The WebTorrent.Torrent instance
 * @returns True if the torrent is actively downloading
 */
export function isTorrentActive(torrent: WebTorrent.Torrent): boolean {
  return !torrent.done && !torrent.paused && torrent.downloadSpeed > 0;
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 GB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format speed to human-readable string
 *
 * @param bytesPerSecond - Speed in bytes per second
 * @returns Formatted string (e.g., "1.5 MB/s")
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * Format time remaining to human-readable string
 *
 * @param milliseconds - Time remaining in milliseconds
 * @returns Formatted string (e.g., "2h 30m" or "∞" if infinite)
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "∞";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
