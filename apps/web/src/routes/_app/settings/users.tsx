import { parseString } from "@seedarr/shared";
import { createFileRoute } from "@tanstack/react-router";

import { redirectIfNotRole } from "@/shared/helpers/role.helper";

import { SettingsUsersView } from "@/features/settings/settings-users-view";

export type UsersSearch = {
  q?: string;
};

export const Route = createFileRoute("/_app/settings/users")({
  beforeLoad: ({ context }) => redirectIfNotRole(context, "admin", { to: "/settings/general" }),
  validateSearch: (search: Record<string, unknown>): UsersSearch => {
    const q = parseString(search.q);
    return q ? { q } : {};
  },
  component: SettingsUsersRoute,
});

function SettingsUsersRoute() {
  const search = Route.useSearch();
  return <SettingsUsersView searchQ={search.q} />;
}
