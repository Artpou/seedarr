import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { BookmarkIcon, CalendarIcon, ClockIcon, HeartIcon } from "lucide-react";

import { ResponsiveTabs } from "@/shared/components/responsive-tabs";

type ProfileNavTab = "calendar" | "watchlist" | "liked" | "history";

const PROFILE_NAV_TABS: {
  id: ProfileNavTab;
  label: ReactNode;
  icon: typeof CalendarIcon;
  to: "/user/$id" | "/user/$id/watch-list" | "/user/$id/likes" | "/user/$id/history";
}[] = [
  { id: "calendar", label: <Trans>Calendar</Trans>, icon: CalendarIcon, to: "/user/$id" },
  { id: "watchlist", label: <Trans>Watchlist</Trans>, icon: BookmarkIcon, to: "/user/$id/watch-list" },
  { id: "liked", label: <Trans>Liked</Trans>, icon: HeartIcon, to: "/user/$id/likes" },
  { id: "history", label: <Trans>Watch history</Trans>, icon: ClockIcon, to: "/user/$id/history" },
];

function profileTabFromPath(pathname: string, userId: string): ProfileNavTab {
  const base = `/user/${userId}`;
  if (pathname === `${base}/watch-list` || pathname === `${base}/watch-list/`) return "watchlist";
  if (pathname === `${base}/likes` || pathname === `${base}/likes/`) return "liked";
  if (pathname === `${base}/history` || pathname === `${base}/history/`) return "history";
  return "calendar";
}

type ProfilePageNavProps = {
  userId: string;
  className?: string;
};

export function ProfilePageNav({ userId, className }: ProfilePageNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = profileTabFromPath(location.pathname, userId);

  return (
    <ResponsiveTabs
      className={className}
      value={activeTab}
      onValueChange={(value) => {
        const tab = PROFILE_NAV_TABS.find((entry) => entry.id === value);
        if (!tab) return;
        void navigate({
          to: tab.to,
          params: { id: userId },
          search: location.search,
          resetScroll: false,
        });
      }}
      options={PROFILE_NAV_TABS.map((tab) => ({
        value: tab.id,
        label: tab.label,
        icon: tab.icon,
      }))}
    />
  );
}
