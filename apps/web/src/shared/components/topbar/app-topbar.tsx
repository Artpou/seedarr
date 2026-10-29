import { useEffect, useState } from "react";

import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react/macro";
import { Link, useLocation, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon, MoonIcon, SettingsIcon, SunIcon, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { SelectI18nLang } from "@/shared/components/select/select-i18n-lang";
import { TopbarDiscoverScoped } from "@/shared/components/topbar/topbar-discover-scoped";
import { TopbarDownloads } from "@/shared/components/topbar/topbar-downloads";
import { TopbarProfile } from "@/shared/components/topbar/topbar-profile";
import { getTopbarMode } from "@/shared/components/topbar/topbar-route.helper";
import { TopbarRouteSearch } from "@/shared/components/topbar/topbar-route-search";
import { APP_NAV_ITEMS } from "@/shared/config/nav";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { TvRouterLink } from "@/shared/ui/tv/tv-router-link";

import { useAuth } from "@/features/auth/auth-store";
import { DownloadButtonSynchronize } from "@/features/downloads/components/button/download-button-synchronize";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { validateSearchRouteSearch } from "@/routes/helpers/search-route.helper";

interface AppTopbarProps {
  isAuthenticated?: boolean;
}

const PROFILE_LINK = msg({ id: "nav.profile", message: "Profile" });

function LogoLink() {
  const tvMode = useTvMode();
  const className = "group flex shrink-0 items-center gap-2";
  const branding = (
    <>
      <img
        src="/logo192.png"
        alt="Seedarr"
        className="size-8 mr-1 transition-all duration-300 group-hover:drop-shadow-[0_0_16px_oklch(0.63_0.13_135/1)]"
      />
      <span className="hidden lg:block text-lg font-semibold">Seedarr</span>
    </>
  );

  if (tvMode) {
    return <div className={className}>{branding}</div>;
  }

  return (
    <TvRouterLink tvFocusKey="NAV-LOGO" to="/movies" search={{}} accessibilityLabel="Seedarr" className={className}>
      {branding}
    </TvRouterLink>
  );
}

function Navlink({
  to,
  isActive,
  icon: Icon,
  label,
  search = {},
  params,
}: {
  to: string;
  isActive: boolean;
  icon: typeof UserIcon;
  label: React.ReactNode;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
}) {
  const focusKey = `NAV-${to}${params ? `-${Object.values(params).join("-")}` : ""}`;
  const className = cn(
    "relative inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
    isActive ? "bg-primary/50" : "hover:bg-input",
  );

  return (
    <TvRouterLink
      tvFocusKey={focusKey}
      to={to}
      params={params}
      search={search}
      data-slot="nav-link"
      className={className}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon className="size-4 shrink-0 opacity-80" />
        {label}
      </span>
    </TvRouterLink>
  );
}

export function AppTopbar({ isAuthenticated = true }: AppTopbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const router = useRouter();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const { t } = useLingui();
  const currentUser = useAuth((s) => s.user);
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const tvMode = useTvMode();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isProfileActive = location.pathname.startsWith("/user");
  const mobileMode = getTopbarMode(location.pathname, currentUser?.id, location.search as Record<string, unknown>);
  const profileUserId = typeof params.id === "string" ? params.id : currentUser?.id;
  const tvLibraryTopbar = tvMode && (location.pathname === "/downloads" || location.pathname === "/downloads/");

  const handleMobileBack = () => {
    if (mobileMode === "search") {
      const type = validateSearchRouteSearch(location.search as Record<string, unknown>).type;
      void navigate({ to: type === "tv" ? "/tv" : "/movies", search: {}, resetScroll: false });
      return;
    }
    router.history.back();
  };

  return (
    <header
      data-slot="app-topbar"
      className={cn(
        "sticky top-0 z-50 h-14 w-full transition-all duration-200",
        isScrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "bg-linear-to-b from-background/90 to-transparent",
      )}
    >
      <div className="container mx-auto flex h-14 items-center gap-4 px-3 md:px-6">
        {isAuthenticated ? (
          isMobile ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {mobileMode === "profile" && profileUserId && currentUser?.id === profileUserId ? (
                <>
                  <TopbarProfile userId={profileUserId} />
                  <TopbarRouteSearch classNameWrapper="min-w-0 flex-1" />
                  <Button
                    variant="ghost"
                    className="shrink-0 rounded-full border border-border"
                    size="icon"
                    aria-label={t`Settings`}
                    icon={SettingsIcon}
                    onClick={() => navigate({ to: "/settings", search: {} })}
                  />
                </>
              ) : mobileMode === "movies-scoped" ? (
                <TopbarDiscoverScoped mediaType="movie" />
              ) : mobileMode === "tv-scoped" ? (
                <TopbarDiscoverScoped mediaType="tv" />
              ) : (
                <>
                  {mobileMode === "default" || mobileMode === "search" || mobileMode === "settings" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMobileBack}
                      aria-label={t`Go back`}
                      icon={ArrowLeftIcon}
                    />
                  ) : (
                    <LogoLink />
                  )}
                  {mobileMode === "downloads" ? (
                    <TopbarDownloads />
                  ) : mobileMode === "settings" ? (
                    <>
                      <div className="min-w-0 flex-1">
                        <TopbarRouteSearch classNameWrapper="w-full" />
                      </div>
                      <Button
                        variant="ghost"
                        className="shrink-0 rounded-full border border-border"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label={theme === "dark" ? t`Light mode` : t`Dark mode`}
                        icon={theme === "dark" ? SunIcon : MoonIcon}
                      />
                    </>
                  ) : (
                    <TopbarRouteSearch classNameWrapper="min-w-0 flex-1" autoFocus={mobileMode === "search"} />
                  )}
                </>
              )}
            </div>
          ) : tvMode ? (
            <>
              <div className="flex min-w-0 shrink-0 items-center gap-4">
                <LogoLink />
                <nav
                  className="flex items-center gap-1 rounded-full border border-border bg-background/35 p-1 shadow-sm"
                  aria-label={t`Main`}
                >
                  {APP_NAV_ITEMS.map((item) => {
                    const isActive = location.pathname.startsWith(item.url);
                    return (
                      <Navlink
                        key={item.url}
                        to={item.url}
                        search={{ mode: "tv" }}
                        isActive={isActive}
                        icon={item.icon}
                        label={<Trans id={item.title.id} />}
                      />
                    );
                  })}
                </nav>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <TopbarRouteSearch classNameWrapper="min-w-0 w-full max-w-xl flex-1" />
                {tvLibraryTopbar && <DownloadButtonSynchronize topbar />}
                {currentUser && (
                  <TvRouterLink
                    tvFocusKey={`NAV-/user/$id-${currentUser.id}`}
                    to="/user/$id"
                    params={{ id: currentUser.id }}
                    search={{ mode: "tv" }}
                    data-slot="nav-link"
                    accessibilityLabel={t(PROFILE_LINK)}
                    className={cn(
                      "relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border transition-colors",
                      isProfileActive ? "bg-primary/50" : "hover:bg-input",
                    )}
                  >
                    <UserIcon className="size-5 shrink-0 opacity-90" aria-hidden />
                  </TvRouterLink>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-6">
                <LogoLink />

                <nav
                  className="hidden items-center gap-0.5 overflow-hidden rounded-full border border-border bg-background/35 p-1 shadow-sm backdrop-blur-md md:flex"
                  aria-label={t`Main`}
                >
                  {APP_NAV_ITEMS.map((item) => {
                    const isActive = location.pathname.startsWith(item.url);
                    return (
                      <Navlink
                        key={item.url}
                        to={item.url}
                        search={{}}
                        isActive={isActive}
                        icon={item.icon}
                        label={<Trans id={item.title.id} />}
                      />
                    );
                  })}

                  {currentUser && (
                    <Navlink
                      to="/user/$id"
                      params={{ id: currentUser.id }}
                      search={{}}
                      isActive={isProfileActive}
                      icon={UserIcon}
                      label={<Trans id={PROFILE_LINK.id} />}
                    />
                  )}
                </nav>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <TopbarRouteSearch classNameWrapper="hidden min-w-0 w-full max-w-48 sm:flex lg:max-w-60" />

                <Button
                  variant="ghost"
                  className="rounded-full border border-border"
                  size="icon-lg"
                  onClick={toggleTheme}
                  icon={theme === "dark" ? SunIcon : MoonIcon}
                />

                <Button
                  variant="ghost"
                  className="rounded-full border border-border"
                  size="icon-lg"
                  asChild
                  aria-label={t`Settings`}
                  icon={SettingsIcon}
                >
                  <Link to="/settings" search={{}} />
                </Button>
              </div>
            </>
          )
        ) : (
          <>
            <div className="flex-1" />
            <SelectI18nLang />
          </>
        )}
      </div>
    </header>
  );
}
