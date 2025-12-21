export interface Movie {
  type: "movie" | "show";
  title: string;
  original_title?: string;
  year: number;
  rating: number;
  votes?: number;
  overview?: string;
  tagline?: string;
  runtime: number; // en minutes
  released: string; // Format YYYY-MM-DD
  status?: "released" | "in production" | "planned" | "canceled";

  ids: MovieIds;
  images: MovieImages;

  genres: string[];
  subgenres: string[];

  language?: string;
  languages?: string[];
  available_translations?: string[];
  country?: string;
  certification?: string;

  trailer?: string;
  homepage?: string;

  videoId?: string;
  comment_count?: number;
  after_credits?: boolean;
  during_credits?: boolean;

  offers?: StreamingOffer[];
}

export interface MovieIds {
  imdb: string;
  tmdb?: number;
  trakt?: number;
  slug?: string;
  plex?: {
    guid: string;
    slug: string;
  };
}

export interface MovieImages {
  poster: string[];
  banner: string[];
  thumb?: string[];
  fanart?: string[];
  logo?: string[];
  clearart?: string[];
}

export interface StreamingOffer {
  monetization_type: "flatrate" | "rent" | "buy" | "ads";
  provider_id: number;
  package_short_name: string;
  presentation_type: "sd" | "hd" | "4k";
  urls: {
    standard_web: string;
  };
}
