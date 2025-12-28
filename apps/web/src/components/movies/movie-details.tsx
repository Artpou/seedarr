import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import ms from "ms";
import { useMemo, useState } from "react";
import { TMDB, type MovieDetails as TMDBMovieDetails } from "tmdb-ts";
import { MediaCarousel } from "@/components/media/media-carousel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPosterUrl } from "@/helpers/movie.helper";
import { countryToTmdbLocale } from "@/i18n";

interface MovieDetailsProps {
  movieId: string;
  movie: TMDBMovieDetails;
}

export function MovieDetails({ movieId, movie }: MovieDetailsProps) {
  const { i18n } = useLingui();
  const tmdbLocale = countryToTmdbLocale(i18n.locale);
  const [activeTab, setActiveTab] = useState<"collection" | "recommendations">("collection");

  const { data: credits } = useQuery({
    queryKey: ["movie-credits", movieId, tmdbLocale],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY || "";
      const tmdb = new TMDB(apiKey);
      return await tmdb.movies.credits(Number(movieId));
    },
    staleTime: ms("10m"),
  });

  const { data: recommendations } = useQuery({
    queryKey: ["movie-recommendations", movieId, tmdbLocale],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY || "";
      const tmdb = new TMDB(apiKey);
      const response = await tmdb.movies.recommendations(Number(movieId), { language: tmdbLocale });
      return response.results;
    },
    staleTime: ms("10m"),
  });

  const { data: collection } = useQuery({
    queryKey: ["movie-collection", movie.belongs_to_collection?.id, tmdbLocale],
    queryFn: async () => {
      if (!movie.belongs_to_collection?.id) return null;
      const apiKey = import.meta.env.VITE_TMDB_API_KEY || "";
      const tmdb = new TMDB(apiKey);
      return await tmdb.collections.details(movie.belongs_to_collection.id, {
        language: tmdbLocale,
      });
    },
    enabled: !!movie.belongs_to_collection?.id,
    staleTime: ms("10m"),
  });

  const castAndCrew = useMemo(() => {
    const directors =
      credits?.crew
        ?.filter((person) => person.job === "Director")
        .map((d) => ({ ...d, role: "Director", type: "Director" })) || [];
    const actors =
      credits?.cast?.slice(0, 20).map((a) => ({ ...a, role: a.character, type: "Actor" })) || [];
    return [...directors, ...actors];
  }, [credits]);

  const collectionMovies = useMemo(() => {
    if (!collection?.parts || collection.parts.length <= 1) return [];
    return collection.parts
      .filter((part) => part.id !== Number(movieId))
      .map((part) => ({
        id: part.id,
        title: part.title || part.original_title,
        poster_path: part.poster_path,
        release_date: part.release_date,
        vote_average: part.vote_average,
        type: "movie" as const,
      }));
  }, [collection, movieId]);

  const recommendedMovies = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return [];
    return recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title || rec.original_title,
      poster_path: rec.poster_path,
      release_date: rec.release_date,
      vote_average: rec.vote_average,
      type: "movie" as const,
    }));
  }, [recommendations]);

  const hasCollection = collectionMovies.length > 0;
  const _hasRecommendations = recommendedMovies.length > 0;

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-7 xl:gap-6 container">
      {/* Main Content - Cast & Crew + Recommendations */}
      <div className="xl:col-span-5 space-y-4">
        {/* Cast & Crew */}
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <h2 className="mb-2">
            <Trans>Cast & Crew</Trans>
          </h2>
          <CarouselContent className="pb-2">
            {castAndCrew.map((person) => (
              <CarouselItem
                key={`${person.id}-${person.role}`}
                className="pl-3 basis-28 md:basis-36 flex"
              >
                <Card className="group overflow-hidden border-0 py-0 pb-4 gap-4 flex-1">
                  <img
                    src={getPosterUrl(person.profile_path, "w185")}
                    alt={person.name}
                    className="aspect-square object-cover"
                  />
                  <CardContent className="px-2 space-y-1">
                    <p className="text-xs font-bold line-clamp-2" title={person.name}>
                      {person.name}
                    </p>
                    {person.role && (
                      <p className="text-xs text-muted-foreground truncate" title={person.role}>
                        {person.role}
                      </p>
                    )}
                    <Badge
                      variant={person.type === "Director" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      <Trans>{person.type}</Trans>
                    </Badge>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        {/* Collection & Recommendations */}
        {hasCollection ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "collection" | "recommendations")}
          >
            <TabsList>
              <TabsTrigger value="collection">
                <Trans>Part of {collection?.name}</Trans> ({collectionMovies.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                <Trans>Recommended</Trans> ({recommendedMovies.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="collection">
              <MediaCarousel title="" data={collectionMovies} hideArrows />
            </TabsContent>
            <TabsContent value="recommendations">
              <MediaCarousel title="" data={recommendedMovies} hideArrows />
            </TabsContent>
          </Tabs>
        ) : (
          <MediaCarousel title="Recommended" data={recommendedMovies} hideArrows />
        )}
      </div>

      {/* Sidebar - Additional Info */}
      <div className="xl:col-span-2 space-y-6">
        <div className="space-y-4">
          {/* Status */}
          {movie.status && (
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                <Trans>Status</Trans>
              </p>
              <p className="font-semibold">{movie.status}</p>
            </div>
          )}

          {/* Budget */}
          {movie.budget && (
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                <Trans>Budget</Trans>
              </p>
              <p className="font-semibold">{formatCurrency(movie.budget)}</p>
            </div>
          )}

          {/* Revenue */}
          {movie.revenue && (
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                <Trans>Revenue</Trans>
              </p>
              <p className="font-semibold">{formatCurrency(movie.revenue)}</p>
            </div>
          )}

          {/* Production Companies */}
          {movie.production_companies && movie.production_companies.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                <Trans>Production</Trans>
              </p>
              <div className="text-sm font-semibold">
                {movie.production_companies.map((c) => c.name).join(", ")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
