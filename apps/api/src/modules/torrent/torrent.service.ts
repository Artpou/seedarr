import { Torrent } from "@/types";
import { IndexerAdapter } from "./adapters/base.adapter";
import { JackettAdapter } from "./adapters/jackett.adapter";
import { ProwlarrAdapter } from "./adapters/prowlarr.adapter";
import { Indexer } from "./torrent.d";

export class TorrentService {
  private adapters: Record<"jackett" | "prowlarr", IndexerAdapter> = {
    jackett: new JackettAdapter(),
    prowlarr: new ProwlarrAdapter(),
  };

  private getAdapter(indexer: "jackett" | "prowlarr"): IndexerAdapter {
    return this.adapters[indexer];
  }

  async getIndexers(indexer: "jackett" | "prowlarr", apiKey: string): Promise<Indexer[]> {
    return this.getAdapter(indexer).getIndexers(apiKey);
  }

  async searchTorrents(query: {
    q: string;
    t: string;
    year?: string;
    indexer: "jackett" | "prowlarr";
    apiKey: string;
    indexerId?: string;
  }): Promise<{ recommended: Torrent[]; others: Torrent[] }> {
    // Sanitize query
    const sanitizedQuery = query.q
      .replace(/[:;|<>"/\\*?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Search using appropriate adapter
    const torrents = await this.getAdapter(query.indexer).search(
      { q: sanitizedQuery, t: query.t, indexerId: query.indexerId },
      query.apiKey,
    );

    // Sort by seeders
    torrents.sort((a, b) => b.seeders - a.seeders);

    // Filter by year if provided
    if (query.year) {
      const year = query.year;
      const recommended = torrents.filter((t) => t.title.includes(year));
      const others = torrents.filter((t) => !t.title.includes(year));
      return { recommended, others };
    }

    return { recommended: torrents, others: [] };
  }
}

export const torrentService = new TorrentService();
