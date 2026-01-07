import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { torrentDownload } from "@/db/schema";

// Download schemas
export const torrentDownloadSelectSchema = createSelectSchema(torrentDownload);
export const torrentDownloadInsertSchema = createInsertSchema(torrentDownload);

export type TorrentDownload = typeof torrentDownloadSelectSchema._output;
export type NewTorrentDownload = typeof torrentDownloadInsertSchema._input;

// Download input schema
export const downloadTorrentSchema = z.object({
  magnetUri: z.string(),
  name: z.string(),
  mediaId: z.number().optional(),
  origin: z.string().optional(),
  quality: z.string().optional(),
  language: z.string().optional(),
});

export type DownloadTorrentInput = z.infer<typeof downloadTorrentSchema>;

// Live download data (from WebTorrent)
export interface TorrentLiveData {
  progress: number;
  done: boolean;
  paused: boolean;

  downloadSpeed: number;
  uploadSpeed: number;

  downloaded: number;
  uploaded: number;
  length: number;
  ratio: number;

  numPeers: number;

  timeRemaining: number;

  files: TorrentFileInfo[];
}

export interface TorrentFileInfo {
  name: string;
  path: string;
  length: number;
  downloaded: number;
  progress: number;
}
