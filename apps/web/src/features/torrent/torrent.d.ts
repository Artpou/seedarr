import type { ApiData, api } from "@/lib/api";

export type Torrent = ApiData<ReturnType<typeof api.torrents.search.post>>[number];
export type TorrentIndexer = ApiData<ReturnType<typeof api.torrents.indexers.get>>[number];
