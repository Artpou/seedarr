import { useEffect, useState } from "react";

import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react/macro";
import { Link, useLocation, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon, MoonIcon, SearchIcon, SettingsIcon, SunIcon, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { SelectI18nLang } from "@/shared/components/select/select-i18n-lang";
import { TopbarDiscoverScoped } from "@/shared/components/topbar/topbar-discover-scoped";
import { TopbarDownloads } from "@/shared/components/topbar/topbar-downloads";
import { TopbarMovies } from "@/shared/components/topbar/topbar-movies";
import { TopbarProfile } from "@/shared/components/topbar/topbar-profile";
import { TopbarRequests } from "@/shared/components/topbar/topbar-requests";
import { getMobileTopbarMode } from "@/shared/components/topbar/topbar-route.helper";
import { TopbarSearch } from "@/shared/components/topbar/topbar-search";
import { TopbarSettings } from "@/shared/components/topbar/topbar-settings";
import { TopbarTv } from "@/shared/components/topbar/topbar-tv";
import { APP_NAV_ITEMS } from "@/shared/config/nav";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";

import { useAuth } from "@/features/auth/auth-store";

interface AppTopbarProps {
  isAuthenticated?: boolean;
}

const PROFILE_LINK = msg({ id: "nav.profile", message: "Profile" });

function LogoLink() {
  return (
    <Link to="/movies" className="group flex shrink-0 items-center gap-2">
      <img
        src="/logo192.png"
        alt="Seedarr"
        className="size-8 mr-1 transition-all duration-300 group-hover:drop-shadow-[0_0_16px_oklch(0.63_0.13_135/1)]"
      />
      <span className="hidden lg:block text-lg font-semibold">Seedarr</span>
    </Link>
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
  return (
    <Link
      data-slot="nav-link"
      to={to}
      params={params}
      search={search}
      className={cn(
        "relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        isActive ? "bg-primary/50" : "hover:bg-input",
      )}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon className="size-4 shrink-0 opacity-80" />
        {label}
      </span>
    </Link>
  );
}

export function AppTopbar({ isAuthenticated = true }: AppTopbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const params = useParams({ strict: false });
  const { t } = useLingui();
  const currentUser = useAuth((s) => s.user);
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isProfileActive = location.pathname.startsWith("/user");
  const mobileMode = getMobileTopbarMode(
    location.pathname,
    currentUser?.id,
    location.search as Record<string, unknown>,
  );
  const profileUserId = typeof params.id === "string" ? params.id : currentUser?.id;
  const discoverSearchType = location.pathname.startsWith("/tv") ? "tv" : "movie";

  return (
    <header
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
                <TopbarProfile userId={profileUserId} />
              ) : mobileMode === "movies-scoped" ? (
                <TopbarDiscoverScoped mediaType="movie" />
              ) : mobileMode === "tv-scoped" ? (
                <TopbarDiscoverScoped mediaType="tv" />
              ) : (
                <>
                  {mobileMode === "default" || mobileMode === "search" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.history.back()}
                      aria-label={t`Go back`}
                      icon={ArrowLeftIcon}
                    />
                  ) : (
                    <LogoLink />
                  )}
                  {mobileMode === "movies" && <TopbarMovies />}
                  {mobileMode === "tv" && <TopbarTv />}
                  {mobileMode === "search" && <TopbarSearch />}
                  {mobileMode === "downloads" && <TopbarDownloads />}
                  {mobileMode === "settings" && <TopbarSettings />}
                  {mobileMode === "requests" && <TopbarRequests />}
                </>
              )}
            </div>
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

              <div className="flex flex-1 items-center justify-end gap-2">
                <Button
                  className="rounded-full border border-border lg:min-w-60 justify-start"
                  variant="ghost"
                  onClick={() =>
                    navigate({
                      to: "/search",
                      search: { q: "", type: discoverSearchType },
                    })
                  }
                  aria-label={discoverSearchType === "tv" ? t`Search TV` : t`Search movie`}
                  icon={SearchIcon}
                >
                  <span className="hidden lg:block">
                    {discoverSearchType === "tv" ? t`Search TV ...` : t`Search movie...`}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-full border border-border"
                  size="icon"
                  onClick={toggleTheme}
                  icon={theme === "dark" ? SunIcon : MoonIcon}
                />

                <Button
                  variant="ghost"
                  className="rounded-full border border-border"
                  size="icon"
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
