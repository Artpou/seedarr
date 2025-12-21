interface JackettSearchItem {
  FirstSeen: string; // ISO Date
  Tracker: string;
  TrackerId: string;
  TrackerType: "private" | "public";
  CategoryDesc: string;
  BlackholeLink: string | null;
  Title: string;
  Guid: string;
  Link: string;
  Details: string;
  PublishDate: string; // ISO Date
  Category: number[];
  Size: number; // Taille en bytes
  Files: number | null;
  Grabs: number;
  Description: string | null;
  RageID: number | null;
  TVDBId: number | null;
  Imdb: string | null;
  TMDb: number | null;
  TVMazeId: number | null;
  TraktId: number | null;
  DoubanId: number | null;
  Genres: string[] | null;
  Languages: string[];
  Subs: string[];
  Year: number | null;
  Author: string | null;
  BookTitle: string | null;
  Publisher: string | null;
  Artist: string | null;
  Album: string | null;
  Label: string | null;
  Track: string | null;
  Seeders: number;
  Peers: number;
  Poster: string | null;
  InfoHash: string | null;
  MagnetUri: string | null;
  MinimumRatio: number | null;
  MinimumSeedTime: number | null;
  DownloadVolumeFactor: number;
  UploadVolumeFactor: number;
  Gain: number;
}

export interface JackettSearchResponse {
  Results: JackettSearchItem[];
}

export type TorrentQuality = "SD" | "HD" | "2K" | "4K" | undefined;

export interface Torrent extends JackettSearchItem {
  quality: TorrentQuality;
}
