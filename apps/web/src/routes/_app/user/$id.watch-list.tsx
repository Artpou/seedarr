import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";

import { UserListView } from "@/features/user/components/user-list-view";
import { validateProfileSearch } from "@/routes/helpers/profile-route.helper";

export const Route = createFileRoute("/_app/user/$id/watch-list")({
  validateSearch: validateProfileSearch,
  component: UserWatchListRoute,
});

function UserWatchListRoute() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  return <UserListView userId={id} filter="watch-list" title={<Trans>Watch List</Trans>} search={search} />;
}
