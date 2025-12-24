import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MediaCarousel } from "@/components/media/media-carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTmdb } from "@/hooks/use-tmdb";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { isLogged, tmdb } = useTmdb();
  const [tab, setTab] = useState<"movie" | "tv">("movie");

  // Movies Queries
  const { data: popularMovies } = useQuery({
    queryKey: ["movies", "popular"],
    queryFn: async () => {
      if (!tmdb) throw new Error("TMDB not initialized");
      return await tmdb.movies.popular();
    },
    enabled: !!tmdb && tab === "movie",
  });

  const { data: latestMovies } = useQuery({
    queryKey: ["movies", "latest"],
    queryFn: async () => {
      if (!tmdb) throw new Error("TMDB not initialized");
      return await tmdb.movies.nowPlaying();
    },
    enabled: !!tmdb && tab === "movie",
  });

  const { data: topRatedMovies } = useQuery({
    queryKey: ["movies", "top-rated"],
    queryFn: async () => {
      if (!tmdb) throw new Error("TMDB not initialized");
      return await tmdb.movies.topRated();
    },
    enabled: !!tmdb && tab === "movie",
  });

  // TV Queries
  const { data: popularTV } = useQuery({
    queryKey: ["tv", "popular"],
    queryFn: async () => {
      if (!tmdb) throw new Error("TMDB not initialized");
      return await tmdb.tvShows.popular();
    },
    enabled: !!tmdb && tab === "tv",
  });

  const { data: latestTV } = useQuery({
    queryKey: ["tv", "latest"],
    queryFn: async () => {
      if (!tmdb) throw new Error("TMDB not initialized");
      return await tmdb.tvShows.onTheAir();
    },
    enabled: !!tmdb && tab === "tv",
  });

  const { data: topRatedTV } = useQuery({
    queryKey: ["tv", "top-rated"],
    queryFn: async () => {
      if (!tmdb) throw new Error("TMDB not initialized");
      return await tmdb.tvShows.topRated();
    },
    enabled: !!tmdb && tab === "tv",
  });

  if (!isLogged) {
    return (
      <div className="size-full flex flex-col items-center justify-center relative min-h-[50vh]">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h1 className="text-4xl font-black tracking-tighter">CAMPFIRE</h1>
          <p className="text-muted-foreground">
            <Trans>Configure your TMDB API Key in settings to get started.</Trans>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8 px-4 md:px-8 pb-20">
      <Tabs
        defaultValue="movie"
        className="w-full space-y-8"
        onValueChange={(v) => setTab(v as "movie" | "tv")}
      >
        <div className="flex items-center justify-start">
          <TabsList>
            <TabsTrigger value="movie">
              <Trans>Movies</Trans>
            </TabsTrigger>
            <TabsTrigger value="tv">
              <Trans>TV Shows</Trans>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="movie" className="space-y-12">
          <MediaCarousel
            title={<Trans>Popular Movies</Trans>}
            data={popularMovies?.results || []}
          />
          <MediaCarousel title={<Trans>Now Playing</Trans>} data={latestMovies?.results || []} />
          <MediaCarousel title={<Trans>Top Rated</Trans>} data={topRatedMovies?.results || []} />
        </TabsContent>

        <TabsContent value="tv" className="space-y-12">
          <MediaCarousel title={<Trans>Popular TV Shows</Trans>} data={popularTV?.results || []} />
          <MediaCarousel title={<Trans>On The Air</Trans>} data={latestTV?.results || []} />
          <MediaCarousel title={<Trans>Top Rated</Trans>} data={topRatedTV?.results || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
