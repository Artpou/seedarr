// Export all route types for RPC

// Export enums from schema (these are needed for type constraints)
export type { IndexerType, MediaType, TorrentStatus, UserRole } from "./db/schema";
// Export DTO types (TypeScript types only, not Zod schemas)
export type { LoginInput, RegisterInput } from "./modules/auth/auth.dto";
// Export route types
export type { AuthRoutesType } from "./modules/auth/auth.route";
export type { FreeboxFile, FreeboxFilesResponse } from "./modules/freebox/freebox.dto";
export type { FreeboxRoutesType } from "./modules/freebox/freebox.route";
export type {
  CreateIndexerManagerInput,
  IndexerManager,
  NewIndexerManager,
} from "./modules/indexer-manager/indexer-manager.dto";
export type { IndexerManagerRoutesType } from "./modules/indexer-manager/indexer-manager.route";
export type { Media, MediaStatusBatchInput, NewMedia } from "./modules/media/media.dto";
export type { MediaRoutesType } from "./modules/media/media.route";
export type {
  DownloadTorrentInput,
  NewTorrentDownload,
  Torrent,
  TorrentDownload,
  TorrentFileInfo,
  TorrentIndexer,
  TorrentLiveData,
  TorrentQuality,
} from "./modules/torrent/torrent.dto";
export type { TorrentRoutesType } from "./modules/torrent/torrent.route";
export type { CreateUserInput, NewUser, UpdateUserInput, User } from "./modules/user/user.dto";
export type { UserRoutesType } from "./modules/user/user.route";
// Export main app type
export type { AppType } from "./server";

import type { TorrentDownload as TorrentDownloadDTO } from "./modules/torrent/torrent.dto";
// API-serialized types (Date -> string for JSON)
import type { User as UserDTO } from "./modules/user/user.dto";

export type UserSerialized = Omit<UserDTO, "createdAt"> & {
  createdAt: string;
};

export type TorrentDownloadSerialized = Omit<
  TorrentDownloadDTO,
  "createdAt" | "startedAt" | "completedAt"
> & {
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};
