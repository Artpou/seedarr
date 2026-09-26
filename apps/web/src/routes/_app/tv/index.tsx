import { createFileRoute } from "@tanstack/react-router";

import { countryToTmdbLocale } from "@/shared/helpers/i18n.helper";

import { MediaDiscoverViewSkeleton } from "@/features/media/components/view/media-discover-view-skeleton";
import { prefetchDiscoverRouteQueries } from "@/features/media/helpers/discover-query.helper";
import { validateTvDiscoverSearch } from "@/features/media/helpers/discover-search.helper";
import { TvView } from "@/features/tv/components/tv-view";

export const Route = createFileRoute("/_app/tv/")({
  pendingComponent: MediaDiscoverViewSkeleton,
  component: TvRoute,
  validateSearch: validateTvDiscoverSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all(prefetchDiscoverRouteQueries(context, "tv", deps, countryToTmdbLocale(context.language))),
});

function TvRoute() {
  const search = Route.useSearch();
  return <TvView search={search} />;
}
