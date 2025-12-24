import { Torrent } from "@/types";
import { Indexer } from "../torrent.d";

export interface IndexerAdapter {
  getIndexers(apiKey: string): Promise<Indexer[]>;
  search(query: { q: string; t: string; indexerId?: string }, apiKey: string): Promise<Torrent[]>;
}
