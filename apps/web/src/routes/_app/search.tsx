import { createFileRoute } from "@tanstack/react-router";

import { countryToTmdbLocale } from "@/shared/helpers/i18n.helper";

import { buildMovieDiscoverOptions, buildTvDiscoverOptions } from "@/features/media/helpers/discover-search.helper";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { SearchView } from "@/features/search/components/search-view";
import { tvQueries } from "@/features/tv/hooks/tv.queries";
import {
  omitSearchQueryFromLoaderDeps,
  pickMovieSearchFilters,
  pickTvSearchFilters,
  validateSearchRouteSearch,
} from "@/routes/helpers/search-route.helper";

export const Route = createFileRoute("/_app/search")({
  component: SearchRoute,
  validateSearch: validateSearchRouteSearch,
  loaderDeps: ({ search }) => omitSearchQueryFromLoaderDeps(search),
  loader: ({ context, deps }) => {
    const locale = countryToTmdbLocale(context.language);
    const discoverOptions =
      deps.type === "movie"
        ? buildMovieDiscoverOptions(pickMovieSearchFilters({ ...deps, q: "", type: deps.type }))
        : buildTvDiscoverOptions(pickTvSearchFilters({ ...deps, q: "", type: deps.type }));

    return Promise.all([
      context.queryClient.ensureInfiniteQueryData(
        deps.type === "movie"
          ? movieQueries.discover(discoverOptions, locale)
          : tvQueries.discover(discoverOptions, locale),
      ),
    ]);
  },
});

function SearchRoute() {
  const search = Route.useSearch();
  return <SearchView search={search} />;
}
