/**
 * Data Transfer Objects for Torrent API
 *
 * These DTOs extract only serializable data from WebTorrent.Torrent objects
 * to avoid circular references and non-JSON-safe properties.
 */

/**
 * Live data extracted from an active WebTorrent.Torrent instance
 * All properties are JSON-serializable
 */
export interface TorrentLiveData {
  // Progress information
  progress: number; // 0-1
  done: boolean;
  paused: boolean;

  // Transfer speeds (bytes/sec)
  downloadSpeed: number;
  uploadSpeed: number;

  // Transfer amounts (bytes)
  downloaded: number;
  uploaded: number;
  length: number; // Total size
  ratio: number; // Upload/download ratio

  // Network information
  numPeers: number;

  // Time estimation
  timeRemaining: number; // milliseconds

  // Files in the torrent (without streams/buffers)
  files: TorrentFileInfo[];
}

/**
 * Information about a file in a torrent
 * Extracted from WebTorrent.TorrentFile without non-serializable properties
 */
export interface TorrentFileInfo {
  name: string;
  path: string;
  length: number;
  downloaded: number;
  progress: number; // 0-1
}
