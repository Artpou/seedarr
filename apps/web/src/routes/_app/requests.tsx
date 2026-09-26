import { hasMinRole } from "@seedarr/shared";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { RequestsView } from "@/features/request/components/requests-view";
import { validateRequestsSearch } from "@/routes/helpers/requests-route.helper";

export const Route = createFileRoute("/_app/requests")({
  component: RequestsRoute,
  validateSearch: validateRequestsSearch,
  beforeLoad: ({ context }) => {
    if (!hasMinRole(context.user?.role, "admin")) {
      throw redirect({ to: "/movies", state: { unauthorized: true } });
    }
  },
});

function RequestsRoute() {
  const { type, status, q } = Route.useSearch();
  return <RequestsView type={type} status={status} q={q} />;
}
