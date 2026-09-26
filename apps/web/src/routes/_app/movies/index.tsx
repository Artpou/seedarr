import { createFileRoute } from "@tanstack/react-router";

import { countryToTmdbLocale } from "@/shared/helpers/i18n.helper";

import { MediaDiscoverViewSkeleton } from "@/features/media/components/view/media-discover-view-skeleton";
import { prefetchDiscoverRouteQueries } from "@/features/media/helpers/discover-query.helper";
import { validateMovieDiscoverSearch } from "@/features/media/helpers/discover-search.helper";
import { MoviesView } from "@/features/movies/components/movies-view";

export const Route = createFileRoute("/_app/movies/")({
  pendingComponent: MediaDiscoverViewSkeleton,
  component: MoviesRoute,
  validateSearch: validateMovieDiscoverSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all(prefetchDiscoverRouteQueries(context, "movie", deps, countryToTmdbLocale(context.language))),
});

function MoviesRoute() {
  const search = Route.useSearch();
  return <MoviesView search={search} />;
}
