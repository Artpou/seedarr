import { Trans } from "@lingui/react/macro";
import { Play } from "lucide-react";
import type { MovieDetails as TMDBMovieDetails } from "tmdb-ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { formatRuntime } from "@/helpers/date";
import { getBackdropUrl, getPosterUrl } from "@/helpers/movie.helper";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface MovieDetailsProps {
  movie: TMDBMovieDetails;
  language?: string;
  providers?: Provider[];
}

export function MovieDetails({ movie, language, providers = [] }: MovieDetailsProps) {
  return (
    <div className="relative flex flex-col justify-end">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/60 to-background" />
      </div>

      {/* Banner Content */}
      <div className="relative z-10 px-6 md:px-12 h-full flex flex-col justify-end pb-6 pt-12 w-full">
        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster & Trailer */}
            <div className="hidden md:flex flex-col gap-0 w-56 shrink-0">
              <div className="aspect-2/3 rounded-md rounded-b-none! overflow-hidden border border-secondary shadow-2xl relative group">
                <img
                  src={getPosterUrl(movie.poster_path, "w500")}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="rounded-t-none">
                    <Play className="size-3 fill-current" /> <Trans>WATCH TRAILER</Trans>
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
                <div className="flex items-center gap-3 text-sm font-medium">
                  {movie.release_date && (
                    <Badge variant="secondary">
                      {new Date(movie.release_date).toLocaleDateString(language)}
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
                  {movie.tagline && (
                    <p className="text-muted-foreground italic font-bold">{movie.tagline}</p>
                  )}
                  {movie.overview && (
                    <p className="text-sm  leading-relaxed line-clamp-3 md:line-clamp-none">
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

                {providers.length > 0 && (
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                    {providers.slice(0, 5).map((provider) => (
                      <div
                        key={provider.provider_id}
                        className="size-9 rounded-full overflow-hidden border border-white/10 shadow-sm transition-transform hover:scale-110"
                        title={provider.provider_name}
                      >
                        <img
                          src={getBackdropUrl(provider.logo_path, "original")}
                          alt={provider.provider_name}
                          className="size-full object-cover"
                        />
                      </div>
                    ))}
                    {providers.length > 5 && (
                      <span className="text-[10px] text-white/50 font-bold ml-1">
                        +{providers.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
