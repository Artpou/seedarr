import { Trans } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ActivityIcon, MoonIcon, PuzzleIcon, SettingsIcon, SunIcon, UsersIcon } from "lucide-react";

import { Select } from "@/shared/components/select/select";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";

import { useRole } from "@/features/auth/hooks/use-role";

type SettingsTab = "general" | "activity" | "modules" | "users";

export function TopbarSettings() {
  const { isAdmin, hasRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: "general" as const, label: <Trans>General</Trans>, icon: SettingsIcon, adminOnly: false, memberOnly: false },
    { id: "modules" as const, label: <Trans>Modules</Trans>, icon: PuzzleIcon, adminOnly: true, memberOnly: false },
    { id: "activity" as const, label: <Trans>Activity</Trans>, icon: ActivityIcon, adminOnly: false, memberOnly: true },
    { id: "users" as const, label: <Trans>Users</Trans>, icon: UsersIcon, adminOnly: true, memberOnly: false },
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (tab.adminOnly && !isAdmin) return false;
    if (tab.memberOnly && !hasRole("member")) return false;
    return true;
  });

  const pathSegment = location.pathname.split("/").pop() ?? "general";
  const activeTab = (
    pathSegment === "modules" || pathSegment === "activity" || pathSegment === "users" || pathSegment === "general"
      ? pathSegment
      : location.pathname.includes("/settings/modules")
        ? "modules"
        : "general"
  ) as SettingsTab;

  const isModuleDetail = /\/settings\/modules\/.+/.test(location.pathname);

  if (isModuleDetail) return null;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <Select
        value={activeTab}
        onValueChange={(value) => navigate({ to: `/settings/${value}` as `/settings/${SettingsTab}` })}
        triggerVariant="ghost"
        triggerSize="default"
        triggerClassName="h-9 min-w-0 flex-1 max-w-none shadow-none"
        options={visibleTabs.map((tab) => ({
          value: tab.id,
          label: (
            <span className="flex items-center gap-2">
              <tab.icon className="size-4" />
              {tab.label}
            </span>
          ),
        }))}
      />
      <Button variant="ghost" size="icon" onClick={toggleTheme} icon={theme === "dark" ? SunIcon : MoonIcon} />
    </div>
  );
}
