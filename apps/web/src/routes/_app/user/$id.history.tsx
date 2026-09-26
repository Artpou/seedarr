import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";

import { UserListView } from "@/features/user/components/user-list-view";
import { validateProfileSearch } from "@/routes/helpers/profile-route.helper";

export const Route = createFileRoute("/_app/user/$id/history")({
  validateSearch: validateProfileSearch,
  component: UserHistoryRoute,
});

function UserHistoryRoute() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  return <UserListView userId={id} filter="history" title={<Trans>Watch History</Trans>} search={search} />;
}
