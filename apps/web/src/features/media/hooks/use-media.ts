import type { ListMediaQuery } from "@seedarr/contracts";
import type { Media } from "@seedarr/sdk";
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";

import { mediaQueries, refetchLibraryInterval, refetchMediaInterval } from "@/features/media/hooks/media.queries";

/** Infinite media list with auto-refetch while any card has an active download. */
export function useMediaList(query: ListMediaQuery) {
  return useInfiniteQuery({
    ...mediaQueries.list(query),
    refetchInterval: refetchMediaInterval,
  });
}

/** Flat downloaded library — in-progress first (API `libraryRankSql`), prefetched on discover. */
export function useSuspenseMediaLibrary(type: Media["type"]) {
  return useSuspenseQuery({
    ...mediaQueries.library(type),
    refetchInterval: refetchLibraryInterval,
  });
}
