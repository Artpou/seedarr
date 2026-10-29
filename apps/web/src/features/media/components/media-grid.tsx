import { Fragment, useLayoutEffect, useState } from "react";

import type { Media } from "@seedarr/sdk";
import { useElementScrollRestoration } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { InfiniteGridPrefetchSentinel, InfiniteSentinel } from "@/shared/components/sentinel/infinite-sentinel";
import {
  flattenInfiniteResults,
  type InfiniteResultsQuery,
  prefetchInfiniteOnTvGridFocus,
} from "@/shared/hooks/use-infinite-list";

import { MediaGridSkeleton } from "@/features/media/components/media-grid-skeletons";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { MediaCard } from "./card/media-card";

const MEDIA_GRID_MIN_COL = 165;
const MEDIA_GRID_GAP = 16;

interface MediaGridProps {
  items?: Media[];
  query?: InfiniteResultsQuery<Media>;
  showType?: boolean;
  downloadMode?: boolean;
  tvSelectedMedia?: Media | null;
  onTvItemFocused?: (media: Media) => void;
  tvBarUpFocusKey?: string;
}

function getMediaGridColumns(width: number): number {
  return Math.max(1, Math.floor((width + MEDIA_GRID_GAP) / (MEDIA_GRID_MIN_COL + MEDIA_GRID_GAP)));
}

export function MediaGrid(props: MediaGridProps) {
  const tvMode = useTvMode();
  if (tvMode) {
    return <MediaGridTv {...props} />;
  }
  return <MediaGridVirtual {...props} />;
}

function MediaGridTv({
  items,
  query,
  showType,
  downloadMode,
  tvSelectedMedia,
  onTvItemFocused,
  tvBarUpFocusKey,
}: MediaGridProps) {
  const displayItems = items ?? flattenInfiniteResults(query);
  const isPending = Boolean(query?.isPending) && displayItems.length === 0;

  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(() =>
    getMediaGridColumns(typeof window === "undefined" ? 1200 : Math.min(window.innerWidth - 64, 1400)),
  );

  useLayoutEffect(() => {
    if (!parentEl) return;

    const measure = () => {
      setColumns(getMediaGridColumns(parentEl.getBoundingClientRect().width));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parentEl);
    return () => observer.disconnect();
  }, [parentEl]);

  if (isPending) {
    return <MediaGridSkeleton />;
  }

  if (displayItems.length === 0) return null;

  const totalRows = Math.ceil(displayItems.length / columns);
  const prefetchRow = Math.max(0, totalRows - 2);

  const handleTvFocus = (media: Media): void => {
    onTvItemFocused?.(media);
    prefetchInfiniteOnTvGridFocus(media, displayItems, columns, query);
  };

  return (
    <>
      <div
        ref={setParentEl}
        className="grid w-full gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {displayItems.map((item, index) => {
          const row = Math.floor(index / columns);
          const showPrefetchSentinel = query?.hasNextPage && index % columns === 0 && row === prefetchRow;

          return (
            <Fragment key={`${item.type}-${item.id}`}>
              {showPrefetchSentinel ? <InfiniteGridPrefetchSentinel query={query} /> : null}
              <div className="relative">
                <MediaCard
                  media={item}
                  showPreview={!downloadMode}
                  showPlay
                  showSocial={!downloadMode}
                  showType={showType}
                  showQuality={downloadMode}
                  showDownload
                  tvHighlighted={
                    tvSelectedMedia != null && tvSelectedMedia.id === item.id && tvSelectedMedia.type === item.type
                  }
                  onTvFocused={handleTvFocus}
                  tvBarUpFocusKey={tvBarUpFocusKey}
                />
              </div>
            </Fragment>
          );
        })}
      </div>
      <InfiniteSentinel
        query={query}
        scrollRootSelector="[data-slot='tv-browse-scroll']"
        rootMargin="0px 0px 400px 0px"
      />
    </>
  );
}

function MediaGridVirtual({ items, query, showType, downloadMode }: MediaGridProps) {
  const displayItems = items ?? flattenInfiniteResults(query);
  const isPending = Boolean(query?.isPending) && displayItems.length === 0;

  const scrollEntry = useElementScrollRestoration({
    getElement: () => (typeof window !== "undefined" ? window : null),
  });

  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState(() =>
    typeof window === "undefined" ? 1200 : Math.min(window.innerWidth - 64, 1400),
  );
  const [columns, setColumns] = useState(() => getMediaGridColumns(gridWidth));
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (!parentEl) return;

    const measure = () => {
      const rect = parentEl.getBoundingClientRect();
      setGridWidth(rect.width);
      setColumns(getMediaGridColumns(rect.width));
      setScrollMargin(rect.top + window.scrollY);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parentEl);
    return () => observer.disconnect();
  }, [parentEl]);

  const rowCount = Math.ceil(displayItems.length / columns);
  const estimateSize = () => {
    const width = gridWidth || MEDIA_GRID_MIN_COL;
    const colWidth = (width - MEDIA_GRID_GAP * (columns - 1)) / columns;
    return colWidth * 1.5 + MEDIA_GRID_GAP;
  };

  const virtualizer = useWindowVirtualizer({
    count: isPending ? 0 : rowCount,
    estimateSize,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 4,
    scrollMargin,
    initialOffset: scrollEntry?.scrollY,
  });

  const virtualRows = virtualizer.getVirtualItems();

  if (isPending) {
    return <MediaGridSkeleton />;
  }

  if (displayItems.length === 0) return null;

  return (
    <>
      <div ref={setParentEl} className="w-full">
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualRows.map((virtualRow) => {
            const start = virtualRow.index * columns;
            const rowItems = displayItems.slice(start, start + columns);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  paddingBottom: MEDIA_GRID_GAP,
                  transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                {rowItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="relative">
                    <MediaCard
                      media={item}
                      showPreview={!downloadMode}
                      showPlay
                      showSocial={!downloadMode}
                      showType={showType}
                      showQuality={downloadMode}
                      showDownload
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <InfiniteSentinel query={query} />
    </>
  );
}
