import type { Torrent, TorrentIndexer } from "@/modules/torrent/torrent.dto";

export interface IndexerAdapter {
  getIndexers(apiKey: string): Promise<TorrentIndexer[]>;
  search(
    query: { q: string; t: string; indexerId?: string; categories?: string[] },
    apiKey: string,
  ): Promise<Torrent[]>;
}
