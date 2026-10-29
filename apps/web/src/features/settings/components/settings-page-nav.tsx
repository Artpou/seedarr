import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ActivityIcon, PuzzleIcon, SettingsIcon, UsersIcon } from "lucide-react";

import { ResponsiveTabs } from "@/shared/components/responsive-tabs";

import { useRole } from "@/features/auth/hooks/use-role";

type SettingsTab = "general" | "activity" | "modules" | "users";

const SETTINGS_TABS: {
  id: SettingsTab;
  label: ReactNode;
  icon: typeof SettingsIcon;
  adminOnly: boolean;
  memberOnly: boolean;
}[] = [
  { id: "general", label: <Trans>General</Trans>, icon: SettingsIcon, adminOnly: false, memberOnly: false },
  { id: "modules", label: <Trans>Modules</Trans>, icon: PuzzleIcon, adminOnly: true, memberOnly: false },
  { id: "activity", label: <Trans>Activity</Trans>, icon: ActivityIcon, adminOnly: false, memberOnly: true },
  { id: "users", label: <Trans>Users</Trans>, icon: UsersIcon, adminOnly: true, memberOnly: false },
];

function settingsTabFromPath(pathname: string): SettingsTab {
  const pathSegment = pathname.split("/").pop() ?? "general";
  if (pathSegment === "modules" || pathSegment === "activity" || pathSegment === "users" || pathSegment === "general") {
    return pathSegment;
  }
  if (pathname.includes("/settings/modules")) return "modules";
  return "general";
}

type SettingsPageNavProps = {
  className?: string;
};

export function SettingsPageNav({ className }: SettingsPageNavProps) {
  const { isAdmin, hasRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = settingsTabFromPath(location.pathname);

  const visibleTabs = SETTINGS_TABS.filter((tab) => {
    if (tab.adminOnly && !isAdmin) return false;
    if (tab.memberOnly && !hasRole("member")) return false;
    return true;
  });

  return (
    <ResponsiveTabs
      className={className}
      value={activeTab}
      onValueChange={(value) => {
        void navigate({ to: `/settings/${value}` as `/settings/${SettingsTab}` });
      }}
      options={visibleTabs.map((tab) => ({
        value: tab.id,
        label: tab.label,
        icon: tab.icon,
      }))}
    />
  );
}

export function useVisibleSettingsTabs() {
  const { isAdmin, hasRole } = useRole();
  return SETTINGS_TABS.filter((tab) => {
    if (tab.adminOnly && !isAdmin) return false;
    if (tab.memberOnly && !hasRole("member")) return false;
    return true;
  });
}

export type { SettingsTab };
