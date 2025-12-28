import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import ms from "ms";
import { useMemo, useState } from "react";
import { TMDB, type MovieDetails as TMDBMovieDetails, type WatchLocale } from "tmdb-ts";
import { MovieDetails } from "@/components/movies/movie-details";
import { MovieDetailsSkeleton } from "@/components/movies/movie-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRuntime } from "@/helpers/date";
import { getBackdropUrl, getPosterUrl } from "@/helpers/movie.helper";
import { countryToTmdbLocale } from "@/i18n";
import { api } from "@/lib/api";

interface MovieProps {
  movieId: string;
  onMovieLoaded?: (movie: TMDBMovieDetails) => void;
}

export function Movie({ movieId, onMovieLoaded }: MovieProps) {
  const { i18n } = useLingui();
  const tmdbLocale = countryToTmdbLocale(i18n.locale);
  const queryClient = useQueryClient();

  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const { data: movie, isLoading: isLoadingMovie } = useQuery({
    queryKey: ["movie", movieId, tmdbLocale],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY || "";
      const tmdb = new TMDB(apiKey);

      const movie = await tmdb.movies.details(
        Number(movieId),
        ["watch/providers", "videos"],
        tmdbLocale,
      );

      await api.media.track.post({
        ...movie,
        type: "movie",
        title: movie.title || movie.original_title,
      });

      // Invalidate recently-viewed cache after tracking
      queryClient.invalidateQueries({ queryKey: ["recently-viewed"] });

      return movie;
    },
    staleTime: ms("5m"),
  });

  // Notify parent component when movie data is loaded
  if (movie && onMovieLoaded) {
    onMovieLoaded(movie);
  }

  const youtubeTrailer = useMemo(() => {
    if (!movie?.videos?.results) return null;
    const trailer = movie.videos.results.find(
      (video) => video.site === "YouTube" && video.type === "Trailer",
    );
    return trailer || movie.videos.results.find((video) => video.site === "YouTube");
  }, [movie?.videos]);

  const uniqueProviders = useMemo(() => {
    const countryProviders =
      movie?.["watch/providers"]?.results?.[
        (tmdbLocale?.split("-")[1] || "US") as keyof WatchLocale
      ];
    if (!countryProviders) return { flatrate: [], buyRent: [] };

    const flatrate =
      "flatrate" in countryProviders
        ? countryProviders.flatrate?.filter(
            (v, i, a) => a.findIndex((t) => t.provider_id === v.provider_id) === i,
          )
        : [];

    const buy = "buy" in countryProviders ? countryProviders.buy || [] : [];
    const rent = "rent" in countryProviders ? countryProviders.rent || [] : [];

    // Merge buy and rent, then deduplicate
    const buyRent = [...buy, ...rent].filter(
      (v, i, a) => a.findIndex((t) => t.provider_id === v.provider_id) === i,
    );

    return { flatrate, buyRent };
  }, [movie?.["watch/providers"], tmdbLocale]);

  const firstProviders = useMemo(() => {
    if (uniqueProviders.flatrate.length > 0) return uniqueProviders.flatrate.slice(0, 5);
    if (uniqueProviders.buyRent.length > 0) return uniqueProviders.buyRent.slice(0, 5);
    return [];
  }, [uniqueProviders]);

  if (isLoadingMovie) {
    return <MovieDetailsSkeleton />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4">
        <h1 className="text-2xl font-bold">
          <Trans>Movie not found</Trans>
        </h1>
        <Button onClick={() => window.history.back()}>
          <Trans>Go Back</Trans>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="relative w-full">
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

        {/* Content */}
        <div className="relative container mx-auto px-6 md:px-12 py-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster & Trailer */}
            <div className="hidden md:flex flex-col w-56 shrink-0">
              <img
                src={getPosterUrl(movie.poster_path, "w500")}
                alt={movie.title}
                className="aspect-2/3 rounded-t-md object-cover border border-secondary shadow-2xl"
              />
              {youtubeTrailer && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="rounded-t-none">
                      <Play className="size-3 fill-current" /> <Trans>WATCH TRAILER</Trans>
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="sm:max-w-[90vw] max-w-[95vw] p-0 border-none aspect-video"
                    showCloseButton={false}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeTrailer.key}?autoplay=1`}
                      title={movie.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col pb-4">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight">{movie.title}</h1>
                  <div className="flex items-center gap-3 text-sm font-medium mt-4">
                    {movie.release_date && (
                      <Badge variant="secondary">
                        {new Date(movie.release_date).toLocaleDateString(tmdbLocale)}
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

                {/* Synopsis */}
                {(movie.tagline || movie.overview) && (
                  <div className="space-y-2">
                    {movie.tagline && (
                      <p className="text-muted-foreground italic font-bold">{movie.tagline}</p>
                    )}
                    {movie.overview && (
                      <p className="text-sm leading-relaxed line-clamp-3 md:line-clamp-none">
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

                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                    {firstProviders.map((provider) => (
                      <img
                        key={provider.provider_id}
                        src={getBackdropUrl(provider.logo_path, "original")}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="size-9 rounded-full border border-white/10 shadow-sm transition-transform hover:scale-110"
                      />
                    ))}
                    {firstProviders.length <
                      uniqueProviders.flatrate.length + uniqueProviders.buyRent.length && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trans>
                              See all (
                              {uniqueProviders.flatrate.length + uniqueProviders.buyRent.length})
                            </Trans>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80">
                          {uniqueProviders.flatrate.length > 0 && (
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                <Trans>Streaming</Trans>
                              </DropdownMenuLabel>
                              <div className="flex flex-wrap gap-2 p-2">
                                {uniqueProviders.flatrate.map((provider) => (
                                  <img
                                    key={provider.provider_id}
                                    src={getBackdropUrl(provider.logo_path, "original")}
                                    alt={provider.provider_name}
                                    title={provider.provider_name}
                                    className="size-9 rounded-full border border-white/10 shadow-sm"
                                  />
                                ))}
                              </div>
                            </DropdownMenuGroup>
                          )}
                          {uniqueProviders.buyRent.length > 0 && (
                            <>
                              {uniqueProviders.flatrate.length > 0 && <DropdownMenuSeparator />}
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                  <Trans>Buy / Rent</Trans>
                                </DropdownMenuLabel>
                                <div className="flex flex-wrap gap-2 p-2">
                                  {uniqueProviders.buyRent.map((provider) => (
                                    <img
                                      key={provider.provider_id}
                                      src={getBackdropUrl(provider.logo_path, "original")}
                                      alt={provider.provider_name}
                                      title={provider.provider_name}
                                      className="size-9 rounded-full border border-white/10 shadow-sm"
                                    />
                                  ))}
                                </div>
                              </DropdownMenuGroup>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Show Details Button */}
              <div className="flex justify-center mt-auto pt-4">
                <Button
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  variant="outline"
                  className="px-12!"
                >
                  {showMoreInfo ? (
                    <>
                      <ChevronUp className="size-3 mr-2" />
                      <Trans>Hide Details</Trans>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3 mr-2" />
                      <Trans>Show More Details</Trans>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMoreInfo && (
        <div className="container">
          <MovieDetails movieId={movieId} movie={movie} />
        </div>
      )}
    </>
  );
}
