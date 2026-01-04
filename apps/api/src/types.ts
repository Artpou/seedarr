// Export all route types for RPC

// Export database schema types
export type { Media, TorrentDownload, User as UserDB } from "./db/schema";
export type { AuthRoutesType } from "./modules/auth/auth.route";
export type { FreeboxRoutesType } from "./modules/freebox/freebox.route";
export type { IndexerManagerRoutesType } from "./modules/indexer-manager/indexer-manager.route";
export type { MediaRoutesType } from "./modules/media/media.route";
// Export torrent DTOs
export type { TorrentLiveData } from "./modules/torrent/torrent.dto";
export type { TorrentRoutesType } from "./modules/torrent/torrent.route";
export type { UserRoutesType } from "./modules/user/user.route";
// Export main app type
export type { AppType } from "./server";

// API-serialized types (Date -> string for JSON)
import type { TorrentDownload as TorrentDownloadDB, User as UserDB } from "./db/schema";

export type User = Omit<UserDB, "createdAt"> & {
  createdAt: string;
};

export type TorrentDownloadSerialized = Omit<TorrentDownloadDB, "createdAt"> & {
  createdAt: string;
};
