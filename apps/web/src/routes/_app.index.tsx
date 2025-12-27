import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TMDB } from "tmdb-ts";
import { MediaCarousel } from "@/components/media/media-carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { countryToTmdbLocale } from "@/i18n";

type TabType = "movie" | "tv";

const searchSchema = {
  tab: {
    default: "movie" as TabType,
    parse: (value: string): TabType => (value === "tv" ? "tv" : "movie"),
  },
};

export const Route = createFileRoute("/_app/")({
  component: App,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: searchSchema.tab.parse(String(search.tab || searchSchema.tab.default)),
    };
  },
});

function App() {
  const navigate = useNavigate();
  const { tab } = Route.useSearch();

  // Get current locale from Lingui (country code) and convert to TMDB locale
  const { i18n } = useLingui();
  const tmdbLocale = countryToTmdbLocale(i18n.locale);

  // Fetch TMDB data based on selected tab
  const { data, isLoading } = useQuery({
    queryKey: ["home", tab, tmdbLocale],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY || "";

      if (!apiKey) {
        return null;
      }

      const tmdb = new TMDB(apiKey);

      if (tab === "tv") {
        const [popularTV, latestTV, topRatedTV] = await Promise.all([
          tmdb.tvShows.popular({ language: tmdbLocale }),
          tmdb.tvShows.onTheAir({ language: tmdbLocale }),
          tmdb.tvShows.topRated({ language: tmdbLocale }),
        ]);

        return {
          tab: "tv" as const,
          popularTV,
          latestTV,
          topRatedTV,
        };
      }

      // Default: fetch movies
      const [popularMovies, latestMovies, topRatedMovies] = await Promise.all([
        tmdb.movies.popular({ language: tmdbLocale }),
        tmdb.movies.nowPlaying({ language: tmdbLocale }),
        tmdb.movies.topRated({ language: tmdbLocale }),
      ]);

      return {
        tab: "movie" as const,
        popularMovies,
        latestMovies,
        topRatedMovies,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="size-full flex flex-col items-center justify-center relative min-h-[50vh]">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h1 className="text-4xl font-black tracking-tighter">CAMPFIRE</h1>
          <p className="text-muted-foreground">
            <Trans>Loading...</Trans>
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
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

  const handleTabChange = (value: string) => {
    navigate({
      to: "/",
      search: { tab: value as TabType },
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-8 px-4 md:px-8 pb-20">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full space-y-8">
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
          {data.tab === "movie" && (
            <>
              <MediaCarousel
                title={<Trans>Popular Movies</Trans>}
                data={data.popularMovies.results || []}
              />
              <MediaCarousel
                title={<Trans>Now Playing</Trans>}
                data={data.latestMovies.results || []}
              />
              <MediaCarousel
                title={<Trans>Top Rated</Trans>}
                data={data.topRatedMovies.results || []}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="tv" className="space-y-12">
          {data.tab === "tv" && (
            <>
              <MediaCarousel
                title={<Trans>Popular TV Shows</Trans>}
                data={data.popularTV.results || []}
              />
              <MediaCarousel title={<Trans>On The Air</Trans>} data={data.latestTV.results || []} />
              <MediaCarousel
                title={<Trans>Top Rated</Trans>}
                data={data.topRatedTV.results || []}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
