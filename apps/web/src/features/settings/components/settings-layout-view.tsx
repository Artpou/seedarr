import { Trans } from "@lingui/react/macro";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { ActivityIcon, PuzzleIcon, SettingsIcon, UsersIcon } from "lucide-react";

import { AppVersionCard } from "@/shared/components/app-version-card";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Container } from "@/shared/ui/container";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { useRole } from "@/features/auth/hooks/use-role";

type SettingsTab = "general" | "activity" | "modules" | "users";

export function SettingsLayoutView() {
  const { isAdmin, hasRole } = useRole();
  const location = useLocation();
  const isMobile = useIsMobile();

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

  const activeTab = (location.pathname.split("/").pop() ?? "general") as SettingsTab;
  const isModuleDetail = location.pathname.includes("/settings/modules/");

  return (
    <Container className="pb-3 sm:pb-6">
      <div className="flex flex-col md:flex-row md:gap-6 md:gap-8">
        {!isModuleDetail && !isMobile && (
          <aside className="shrink-0 space-y-4 md:sticky md:top-14 md:w-56 md:self-start md:overscroll-contain">
            <Tabs value={activeTab}>
              <TabsList className="h-auto w-full flex-col gap-1 bg-transparent p-0">
                {visibleTabs.map((tab) => (
                  <TabsTrigger className="w-full justify-start" key={tab.id} value={tab.id} size="lg" asChild>
                    <Link to={`/settings/${tab.id}` as `/settings/${SettingsTab}`}>
                      <tab.icon className="size-4" />
                      {tab.label}
                    </Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <AppVersionCard />
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </Container>
  );
}
