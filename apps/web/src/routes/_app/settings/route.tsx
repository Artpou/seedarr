import { createFileRoute } from "@tanstack/react-router";

import { SettingsLayoutView } from "@/features/settings/settings-layout-view";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsLayoutView,
});
