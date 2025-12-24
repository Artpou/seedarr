import { getTorrentQuality } from "@/helpers/video";
import { JackettSearchResponse, Torrent } from "@/types";
import { Indexer } from "../torrent.d";
import { IndexerAdapter } from "./base.adapter";

export class JackettAdapter implements IndexerAdapter {
  private baseUrl = "http://localhost:9117/api/v2.0";

  async getIndexers(apiKey: string): Promise<Indexer[]> {
    const url = new URL(`${this.baseUrl}/indexers`);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("configured", "true");

    console.log(`[Jackett] GET ${url.toString()}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Jackett indexers failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { ID: string; Name: string; Type: string }[];

    return data.map((indexer) => ({
      id: indexer.ID,
      name: indexer.Name,
      privacy: indexer.Type as "private" | "semi-private" | "public",
    }));
  }

  async search(
    query: { q: string; t: string; indexerId?: string },
    apiKey: string,
  ): Promise<Torrent[]> {
    const url = new URL(`${this.baseUrl}/indexers/all/results`);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("Query", query.q);
    url.searchParams.set("Type", query.t);

    if (query.indexerId) {
      url.searchParams.append("Tracker[]", query.indexerId);
    }

    console.log(`[Jackett] GET ${url.toString()}`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Jackett indexer ${query.indexerId} failed: ${response.statusText}`);
    }

    const data = (await response.json()) as JackettSearchResponse;

    return (data.Results || []).map((result) => ({
      title: result.Title,
      tracker: result.Tracker,
      size: result.Size,
      publishDate: result.PublishDate,
      seeders: result.Seeders,
      peers: result.Peers,
      link: result.Link,
      guid: result.Guid,
      quality: getTorrentQuality(result.Title),
      detailsUrl: result.Details,
      indexerType: "jackett",
    }));
  }
}
