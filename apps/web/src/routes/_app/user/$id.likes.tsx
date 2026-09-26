import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";

import { UserListView } from "@/features/user/components/user-list-view";
import { validateProfileSearch } from "@/routes/helpers/profile-route.helper";

export const Route = createFileRoute("/_app/user/$id/likes")({
  validateSearch: validateProfileSearch,
  component: UserLikesRoute,
});

function UserLikesRoute() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  return <UserListView userId={id} filter="like" title={<Trans>Liked</Trans>} search={search} />;
}
