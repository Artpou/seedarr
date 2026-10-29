import { type InfiniteResultsQuery, useInfiniteSentinel } from "@/shared/hooks/use-infinite-list";

type InfiniteSentinelProps<T> = {
  query?: InfiniteResultsQuery<T>;
  scrollRootSelector?: string;
  rootMargin?: string;
  className?: string;
};

export function InfiniteSentinel<T>({ query, scrollRootSelector, rootMargin, className }: InfiniteSentinelProps<T>) {
  const { sentinelRef } = useInfiniteSentinel(query, { scrollRootSelector, rootMargin });

  if (!query?.hasNextPage) return null;
  return <div ref={sentinelRef} className={className ?? "h-4"} aria-hidden />;
}

/** Sentinel placed before the last two grid rows (TV browse). */
export function InfiniteGridPrefetchSentinel<T>({ query }: { query?: InfiniteResultsQuery<T> }) {
  return (
    <InfiniteSentinel
      query={query}
      scrollRootSelector="[data-slot='tv-browse-scroll']"
      rootMargin="0px 0px 480px 0px"
      className="col-span-full h-px w-full"
    />
  );
}
