import { createFileRoute } from "@tanstack/react-router";

import { countryToTmdbLocale } from "@/shared/helpers/i18n.helper";

import type { MediaDetailTab } from "@/features/media/media-detail-view";
import { MediaDetailsViewSkeleton } from "@/features/media/media-details-view-skeleton";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { MovieDetailView } from "@/features/movies/movie-detail-view";

const VALID_TABS: MediaDetailTab[] = ["info", "downloads", "server"];

function validateSearch(search: Record<string, unknown>): { tab?: MediaDetailTab } {
  const tab = search.tab;
  if (typeof tab === "string" && (VALID_TABS as string[]).includes(tab)) return { tab: tab as MediaDetailTab };
  return {};
}

export const Route = createFileRoute("/_app/movies/$id/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(movieQueries.details(params.id, countryToTmdbLocale(context.language))),
  pendingComponent: MediaDetailsViewSkeleton,
  component: MovieRoute,
  validateSearch,
});

function MovieRoute() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  return <MovieDetailView movieId={id} urlTab={tab} />;
}
