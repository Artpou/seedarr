import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Play } from "lucide-react";
import ms from "ms";
import { MovieDetailsSkeleton } from "@/components/movies/movie-details-skeleton";
import { TorrentTable } from "@/components/torrent/torrent-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { formatRuntime } from "@/helpers/date";
import { useTmdb } from "@/hooks/use-tmdb";
import { api } from "@/lib/api";

const getImageUrl = (path: string | null | undefined, size = "original") => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const Route = createFileRoute("/movies/$movieId")({
  component: MovieDetails,
});

function MovieDetails() {
  const { apiKey } = useTmdb();
  const { movieId } = Route.useParams();

  const { data: movieResponse, isLoading: isMovieLoading } = useQuery({
    queryKey: ["movie", movieId, apiKey],
    queryFn: () =>
      api.movies[movieId].get({
        $headers: apiKey ? { Authorization: apiKey } : undefined,
      }),
    staleTime: ms("1h"),
  });

  const { data: providersResponse } = useQuery({
    queryKey: ["movie-providers", movieId, apiKey],
    queryFn: () =>
      api.movies[movieId]["watch-providers"].get({
        $headers: apiKey ? { Authorization: apiKey } : undefined,
      }),
    staleTime: ms("1h"),
    enabled: !!movieResponse?.data,
  });

  const movie = movieResponse?.data;
  const providers = providersResponse?.data?.results?.FR; // Default to FR
  const allProviders = providers
    ? [...(providers.flatrate || []), ...(providers.buy || []), ...(providers.rent || [])]
    : [];

  // Deduplicate providers by provider_id
  const uniqueProviders = allProviders.filter(
    (v, i, a) => a.findIndex((t) => t.provider_id === v.provider_id) === i,
  );

  if (isMovieLoading) {
    return <MovieDetailsSkeleton />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const release_year = new Date(movie.release_date).getFullYear().toString();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative flex flex-col justify-end">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: `url(${getImageUrl(movie.backdrop_path || movie.poster_path)})`,
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/80 to-background" />
          <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Banner Content */}
        <div className="relative z-10 px-6 md:px-12 h-full flex flex-col justify-end pb-6 pt-12 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster & Trailer */}
            <div className="hidden md:flex flex-col gap-0 w-56 shrink-0">
              <div className="aspect-2/3 rounded-md overflow-hidden border border-white/10 shadow-2xl relative group">
                <img
                  src={getImageUrl(movie.poster_path, "w500")}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mt-0 h-10 rounded-b-md rounded-t-none bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border-t border-white/10 gap-2 font-bold uppercase text-xs">
                    <Play className="size-3 fill-current" /> WATCH TRAILER
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] p-0 bg-black border-none overflow-hidden aspect-video">
                  {/* Trailer content */}
                </DialogContent>
              </Dialog>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{movie.title}</h1>
                <div className="flex items-center gap-3 text-sm text-white/70 font-light">
                  {movie.release_date && (
                    <Badge variant="secondary">
                      {new Date(movie.release_date).toLocaleDateString()}
                    </Badge>
                  )}
                  <span className="opacity-30">•</span>
                  {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
                  <span className="opacity-30">•</span>
                  {movie.genres && movie.genres.length > 0 && (
                    <span>
                      {movie.genres
                        .slice(0, 3)
                        .map((genre) => (typeof genre === "string" ? genre : genre.name))
                        .join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Synopsis in Hero */}
              {(movie.tagline || movie.overview) && (
                <div className="max-w-3xl space-y-2">
                  {movie.tagline && <p className="text-white/60 italic text-sm">{movie.tagline}</p>}
                  {movie.overview && (
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-3 md:line-clamp-none">
                      {movie.overview}
                    </p>
                  )}
                </div>
              )}

              {/* Stats & Providers */}
              <div className="flex items-center gap-4">
                <CircularProgress
                  value={(movie.vote_average || 0) * 10}
                  size={52}
                  strokeWidth={5}
                />

                {uniqueProviders.length > 0 && (
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                    {uniqueProviders.slice(0, 5).map((provider) => (
                      <div
                        key={provider.provider_id}
                        className="size-9 rounded-full overflow-hidden border border-white/10 shadow-sm transition-transform hover:scale-110"
                        title={provider.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="size-full object-cover"
                        />
                      </div>
                    ))}
                    {uniqueProviders.length > 5 && (
                      <span className="text-[10px] text-white/50 font-bold ml-1">
                        +{uniqueProviders.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 mt-20 flex flex-col gap-12 w-full">
        <div className="space-y-10">
          {/* Torrents List */}
          <div className="space-y-6 border-t border-border pt-10 pb-20 w-full">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2">
                <Download className="size-6 text-primary" /> AVAILABLE TORRENTS
              </h2>
            </div>

            <div className="w-full">
              <TorrentTable search={movie?.title || ""} year={release_year} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
