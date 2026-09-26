import { createFileRoute } from "@tanstack/react-router";

import { DownloadsView } from "@/features/downloads/components/downloads-view";
import { downloadQueries } from "@/features/downloads/hooks/download.queries";
import { mediaQueries } from "@/features/media/hooks/media.queries";
import {
  buildDownloadsListQuery,
  omitDownloadsSearchQuery,
  validateDownloadsSearch,
} from "@/routes/helpers/downloads-route.helper";

export const Route = createFileRoute("/_app/downloads/")({
  component: DownloadsRoute,
  validateSearch: validateDownloadsSearch,
  loaderDeps: ({ search }) => omitDownloadsSearchQuery(search),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureInfiniteQueryData(mediaQueries.list(buildDownloadsListQuery(deps))),
      context.queryClient.ensureQueryData(downloadQueries.stats()),
    ]),
});

function DownloadsRoute() {
  const search = Route.useSearch();
  return <DownloadsView search={search} />;
}
