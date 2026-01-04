import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { indexerTypeEnum, torrentDownload } from "@/db/schema";

// ============================================================================
// Database schemas (TorrentDownload)
// ============================================================================

export const torrentDownloadSelectSchema = createSelectSchema(torrentDownload);
export const torrentDownloadInsertSchema = createInsertSchema(torrentDownload);

export type TorrentDownload = typeof torrentDownloadSelectSchema._output;
export type NewTorrentDownload = typeof torrentDownloadInsertSchema._input;

// ============================================================================
// Non-database types (Torrent search results from indexers)
// ============================================================================

export type TorrentQuality = "SD" | "HD" | "2K" | "4K" | undefined;

// Torrent indexer schema
export const torrentIndexerSchema = z.object({
  id: z.string(),
  name: z.enum(indexerTypeEnum),
  privacy: z.enum(["private", "semi-private", "public"]),
});

export type TorrentIndexer = z.infer<typeof torrentIndexerSchema>;

// Torrent search result schema
export const torrentSchema = z.object({
  title: z.string(),
  tracker: z.string(),
  size: z.number(),
  publishDate: z.string(),
  seeders: z.number(),
  peers: z.number(),
  link: z.string(),
  guid: z.string(),
  quality: z.union([
    z.literal("SD"),
    z.literal("HD"),
    z.literal("2K"),
    z.literal("4K"),
    z.undefined(),
  ]),
  language: z.string().optional(),
  detailsUrl: z.string().optional(),
  indexerType: z.enum(indexerTypeEnum),
  // Optional fields from different indexers
  downloadUrl: z.string().optional(), // OxTorrent, etc.
  magnetUrl: z.string().optional(), // Prowlarr redirect URL
});

export type Torrent = z.infer<typeof torrentSchema>;

// ============================================================================
// Request schemas
// ============================================================================

export const downloadTorrentSchema = z.object({
  magnetUri: z.string(),
  name: z.string(),
  mediaId: z.number().optional(),
  origin: z.string().optional(),
  quality: z.string().optional(),
  language: z.string().optional(),
});

export type DownloadTorrentInput = z.infer<typeof downloadTorrentSchema>;

// ============================================================================
// Live data interfaces (non-serializable WebTorrent data)
// ============================================================================

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
