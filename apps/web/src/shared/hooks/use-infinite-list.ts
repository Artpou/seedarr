import { useCallback, useEffect, useRef, useState } from "react";

export type InfiniteResultsQuery<T> = {
  data?: { pages: Array<{ results: T[] }> };
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
};

export function flattenInfiniteResults<T>(query?: InfiniteResultsQuery<T>): T[] {
  return query?.data?.pages.flatMap((page) => page.results) ?? [];
}

type InfiniteSentinelOptions = {
  rootMargin?: string;
  /** Closest scroll root for nested TV browse scroll (defaults to viewport). */
  scrollRootSelector?: string;
};

export function useInfiniteSentinel<T>(query?: InfiniteResultsQuery<T>, options?: InfiniteSentinelOptions) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const gateRef = useRef(false);

  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    const releaseGate = (): void => {
      gateRef.current = false;
    };
    window.addEventListener("scroll", releaseGate, { passive: true });
    return () => {
      window.removeEventListener("scroll", releaseGate);
    };
  }, []);

  useEffect(() => {
    if (!node) return;

    const root = options?.scrollRootSelector ? node.closest(options.scrollRootSelector) : null;
    if (!(root instanceof Element)) return;

    const releaseGate = (): void => {
      gateRef.current = false;
    };
    root.addEventListener("scroll", releaseGate, { passive: true });
    return () => {
      root.removeEventListener("scroll", releaseGate);
    };
  }, [node, options?.scrollRootSelector]);

  useEffect(() => {
    if (!node) return;

    const root = options?.scrollRootSelector ? node.closest(options.scrollRootSelector) : null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false);
      },
      {
        root: root instanceof Element ? root : null,
        rootMargin: options?.rootMargin ?? "0px 0px 300px 0px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, options?.rootMargin, options?.scrollRootSelector]);

  const fetchNextPage = query?.fetchNextPage;
  const hasNextPage = query?.hasNextPage;
  const isFetchingNextPage = query?.isFetchingNextPage;

  useEffect(() => {
    if (!isIntersecting) {
      gateRef.current = false;
      return;
    }
    if (!hasNextPage || isFetchingNextPage || gateRef.current) return;

    gateRef.current = true;
    void fetchNextPage?.();
  }, [isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return { sentinelRef };
}

/** Prefetch when TV spatial focus reaches the last rows of a grid. */
export function prefetchInfiniteOnTvGridFocus<T extends { id: number; type: string }>(
  media: T,
  items: T[],
  columns: number,
  query?: InfiniteResultsQuery<T>,
): void {
  if (!query?.hasNextPage || query.isFetchingNextPage || columns < 1) return;

  const index = items.findIndex((item) => item.id === media.id && item.type === media.type);
  if (index < 0) return;

  const row = Math.floor(index / columns);
  const totalRows = Math.ceil(items.length / columns);
  if (row >= totalRows - 2) {
    void query.fetchNextPage();
  }
}
