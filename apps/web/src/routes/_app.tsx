import { useEffect, useRef } from "react";

import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { api, unwrap } from "@seedarr/sdk";
import { createFileRoute, isRedirect, Link, Outlet, redirect, useLocation, useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { UserIcon } from "lucide-react";
import ms from "ms";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AppAmbientBackground } from "@/shared/components/app-ambient-background";
import { RoutePendingFallback } from "@/shared/components/route-pending-fallback";
import { AppTopbar } from "@/shared/components/topbar/app-topbar";
import { ErrorView } from "@/shared/components/view/error-view";
import { APP_NAV_ITEMS } from "@/shared/config/nav";

import { useAuth } from "@/features/auth/auth-store";
import { useRole } from "@/features/auth/hooks/use-role";
import { TvAppFocus } from "@/features/tv-mode/tv-app-focus";
import { TvBackNavigation } from "@/features/tv-mode/tv-back-navigation";
import { TvMainChrome } from "@/features/tv-mode/tv-main-chrome";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { TvSidebar } from "@/features/tv-mode/tv-sidebar";
import { isSearchPath } from "@/routes/helpers/search-route.helper";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData({
        queryKey: ["auth", "me"],
        queryFn: () => unwrap(api.auth.me.$get()),
        staleTime: ms("5m"),
      });
      useAuth.getState().setUser(user);

      if (!user.onboarded) {
        throw redirect({ to: "/onboarding" });
      }

      return { user };
    } catch (err) {
      if (isRedirect(err)) throw err;

      const isNetworkError =
        err &&
        typeof err === "object" &&
        "status" in err &&
        ((err as { status: number }).status === 0 || (err as { status: number }).status >= 502);
      if (isNetworkError) {
        throw err;
      }

      useAuth.getState().setUser(null);
      throw redirect({ to: "/login" });
    }
  },
  errorComponent: ErrorView,
  pendingComponent: RoutePendingFallback,
  component: AuthenticatedLayout,
});

interface MobileNavItem {
  title: ReturnType<typeof msg>;
  url: string;
  icon: LucideIcon;
  minRole?: "member" | "admin" | "owner";
  matchPrefix?: string;
}

const MOBILE_NAV_STATIC = APP_NAV_ITEMS.map((item) => ({
  title: item.title,
  url: item.url,
  icon: item.mobileIcon ?? item.icon,
}));

function AuthenticatedLayout() {
  const user = useAuth((s) => s.user);
  const { hasRole } = useRole();
  const { state, href, pathname } = useLocation();
  const { t } = useLingui();
  const router = useRouter();
  const tvMode = useTvMode();
  const hideTvSidebar = tvMode && (pathname.includes("/play") || isSearchPath(pathname));
  const showTvShell = tvMode && !hideTvSidebar;
  const hideMobileChrome = hideTvSidebar;

  const stateRef = useRef<unknown>(null);

  useEffect(() => {
    if (state?.unauthorized && stateRef.current !== state) {
      stateRef.current = state;

      setTimeout(() => {
        router.history.replace(href, { ...state, unauthorized: undefined });
        toast.error(t`Forbidden`, { description: t`You are not authorized to access this page.` });
      }, 100);
    }
  }, [state, href, router.history, t]);

  const mobileNav: MobileNavItem[] = [
    ...MOBILE_NAV_STATIC,
    {
      title: msg({ id: "nav.profile", message: "Profile" }),
      url: user ? `/user/${user.id}` : "/user",
      icon: UserIcon,
      matchPrefix: "/user",
    },
  ];

  const visibleNavItems = mobileNav.filter((item) => {
    if (item.minRole && !hasRole(item.minRole)) return false;
    return true;
  });

  return (
    <div className="relative min-h-svh bg-background">
      <AppAmbientBackground variant="subtle" />
      <TvAppFocus className={cn("relative z-10 flex min-h-svh min-w-0", showTvShell ? "flex-row" : "flex-col")}>
        <TvBackNavigation />
        {showTvShell ? <TvSidebar /> : null}
        {!tvMode && <AppTopbar isAuthenticated={true} />}
        <main
          className={cn(
            "flex min-w-0 flex-1 flex-col md:pb-0",
            showTvShell && "h-svh min-h-0 overflow-hidden",
            hideMobileChrome ? "pb-0" : "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]",
          )}
        >
          {showTvShell ? (
            <TvMainChrome>
              <Outlet />
            </TvMainChrome>
          ) : (
            <Outlet />
          )}
        </main>

        <nav
          className={cn(
            "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom,0px)]",
            (hideMobileChrome || tvMode) && "hidden",
          )}
        >
          <div className="flex items-center justify-around h-16">
            {visibleNavItems.map((item) => {
              const matchUrl = item.matchPrefix ?? item.url;
              const isActive = pathname.startsWith(matchUrl);
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  search={{}}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  <span className="text-xs font-medium">{t(item.title)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </TvAppFocus>
    </div>
  );
}
