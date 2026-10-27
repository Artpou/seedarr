import { parseString } from "@seedarr/shared";
import { createFileRoute } from "@tanstack/react-router";

import { redirectIfNotRole } from "@/shared/helpers/role.helper";

import { SettingsActivityView } from "@/features/settings/settings-activity-view";

export type ActivitySearch = {
  q?: string;
};

export const Route = createFileRoute("/_app/settings/activity")({
  beforeLoad: ({ context }) => redirectIfNotRole(context, "member", { to: "/settings/general" }),
  validateSearch: (search: Record<string, unknown>): ActivitySearch => {
    const q = parseString(search.q);
    return q ? { q } : {};
  },
  component: SettingsActivityRoute,
});

function SettingsActivityRoute() {
  const search = Route.useSearch();
  return <SettingsActivityView searchQ={search.q} />;
}
