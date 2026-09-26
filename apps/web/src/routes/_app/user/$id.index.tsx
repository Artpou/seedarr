import { createFileRoute } from "@tanstack/react-router";

import { mediaQueries } from "@/features/media/hooks/media.queries";
import { requestQueries } from "@/features/request/hooks/request.queries";
import { UserProfileView } from "@/features/user/components/user-profile-view";
import { userQueries } from "@/features/user/hooks/user.queries";
import { pickProfileLibraryFilters, validateProfileSearch } from "@/routes/helpers/profile-route.helper";

export const Route = createFileRoute("/_app/user/$id/")({
  validateSearch: validateProfileSearch,
  // Exclude `q` so typing in the search field does NOT re-trigger the loader (and the full skeleton).
  loaderDeps: ({ search }) => {
    const { q: _q, ...rest } = search;
    return rest;
  },
  loader: ({ context, params, deps }) => {
    const prefetch: Promise<unknown>[] = [
      context.queryClient.ensureQueryData(userQueries.details(params.id)),
      context.queryClient.ensureQueryData(userQueries.stats(params.id)),
      context.queryClient.ensureInfiniteQueryData(
        mediaQueries.list({
          filter: "calendar",
          userId: params.id,
          ...pickProfileLibraryFilters(deps),
          limit: 100,
        }),
      ),
    ];

    if (context.user?.id === params.id) {
      prefetch.push(context.queryClient.ensureQueryData(requestQueries.mine()));
    }

    return Promise.all(prefetch);
  },
  component: UserProfileRoute,
});

function UserProfileRoute() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  return <UserProfileView userId={id} search={search} />;
}
