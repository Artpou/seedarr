import { Link, Outlet, useLocation } from "@tanstack/react-router";

import { AppVersionCard } from "@/shared/components/app-version-card";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Container } from "@/shared/ui/container";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  SettingsPageNav,
  type SettingsTab,
  useVisibleSettingsTabs,
} from "@/features/settings/components/settings-page-nav";

export function SettingsLayoutView() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const visibleTabs = useVisibleSettingsTabs();

  const activeTab = (location.pathname.split("/").pop() ?? "general") as SettingsTab;
  const isModuleDetail = location.pathname.includes("/settings/modules/");

  return (
    <Container className="pb-3 sm:pb-6">
      {isMobile && !isModuleDetail ? <SettingsPageNav className="mb-4" /> : null}
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
