import {
  isScopedDiscoverSearch,
  validateMovieDiscoverSearch,
  validateTvDiscoverSearch,
} from "@/features/media/helpers/discover-search.helper";
import { isOwnProfileTopbarPath } from "@/routes/helpers/profile-route.helper";

export type MobileTopbarMode =
  | "movies"
  | "movies-scoped"
  | "tv"
  | "tv-scoped"
  | "downloads"
  | "profile"
  | "settings"
  | "requests"
  | "search"
  | "default";

export function getMobileTopbarMode(
  pathname: string,
  currentUserId: string | undefined,
  search: Record<string, unknown> = {},
): MobileTopbarMode {
  if (pathname === "/movies" || pathname === "/movies/") {
    const movieSearch = validateMovieDiscoverSearch(search);
    return isScopedDiscoverSearch(movieSearch) ? "movies-scoped" : "movies";
  }
  if (pathname === "/tv" || pathname === "/tv/") {
    const tvSearch = validateTvDiscoverSearch(search);
    return isScopedDiscoverSearch(tvSearch) ? "tv-scoped" : "tv";
  }
  if (pathname === "/search" || pathname === "/search/") return "search";
  if (pathname === "/downloads" || pathname === "/downloads/") return "downloads";
  if (pathname === "/requests" || pathname === "/requests/") return "requests";
  if (pathname.startsWith("/settings")) {
    if (/\/settings\/modules\/[^/]+/.test(pathname)) return "default";
    return "settings";
  }

  if (currentUserId && isOwnProfileTopbarPath(pathname, currentUserId)) return "profile";

  return "default";
}
