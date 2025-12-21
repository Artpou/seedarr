import { getTorrentQuality } from "@/helpers/video";
import { JackettSearchResponse, Torrent } from "@/types";

export class TorrentService {
  private baseUrl = "http://localhost:9117/api/v2.0/indexers/all/results";

  async searchTorrents(query: { q: string; t: string; year?: string }): Promise<Torrent[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("apikey", process.env.JACKETT_API_KEY || "");
    url.searchParams.set("Query", query.q);
    url.searchParams.set("Type", query.t);

    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as JackettSearchResponse;

    const torrents: Torrent[] = (data.Results || []).map((result) => ({
      ...result,
      quality: getTorrentQuality(result.Title),
    }));

    console.log("🚀 ~ TorrentService ~ searchTorrents ~ torrents:", torrents[0]);

    if (query.year) {
      // Prefer results that contain the year in the title first, then sort by seeders
      const year = query.year;
      return torrents.sort((a, b) => {
        const aHasYear = a.Title.includes(year);
        const bHasYear = b.Title.includes(year);
        if (aHasYear && !bHasYear) return -1;
        if (!aHasYear && bHasYear) return 1;
        // If both (or neither) have the year, sort by seeders desc
        return b.Seeders - a.Seeders;
      });
    }
    // Otherwise, sort by seeders desc
    return torrents.sort((a, b) => b.Seeders - a.Seeders);
  }
}

export const torrentService = new TorrentService();
