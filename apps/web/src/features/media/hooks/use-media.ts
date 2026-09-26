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

/** Flat “in progress” list — prefetched on movies/tv discover routes. */
export function useSuspenseMediaInProgress(type: Media["type"]) {
  return useSuspenseQuery({
    ...mediaQueries.inProgress(type),
    refetchInterval: refetchLibraryInterval,
  });
}
