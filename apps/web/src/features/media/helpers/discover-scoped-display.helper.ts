import type { LucideIcon } from "lucide-react";
import { LayoutGridIcon, SparklesIcon, TrophyIcon } from "lucide-react";

import type { MovieDiscoverSearch, TvDiscoverSearch } from "@/features/media/helpers/discover-search.helper";

export function discoverScopedTitleIcon(search: Partial<MovieDiscoverSearch | TvDiscoverSearch>): LucideIcon {
  if (search.type === "new") return SparklesIcon;
  if (search.type === "top_rated" || search.type === "top-rated") return TrophyIcon;
  return LayoutGridIcon;
}
