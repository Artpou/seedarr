import { useEffect } from "react";

import { useIntersectionObserver } from "@uidotdev/usehooks";

import { Skeleton } from "@/shared/ui/skeleton";

import { Media } from "@/features/media/media";
import { MediaCard } from "./media-card";

interface MediaGridProps {
  items: Media[];
  isLoading?: boolean;
  withType?: boolean;
  onLoadMore?: () => void;
}

export function MediaGrid({
  items,
  isLoading = false,
  withType = false,
  onLoadMore,
}: MediaGridProps) {
  const [lastItemRef, entry] = useIntersectionObserver({
    threshold: 1.0,
  });

  useEffect(() => {
    if (entry?.isIntersecting && onLoadMore) {
      onLoadMore();
    }
  }, [entry, onLoadMore]);

  console.log(isLoading);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
      {items.map((item, index) => (
        <div
          key={`${item.type}-${item.id}`}
          ref={index === items.length - 1 ? lastItemRef : null}
          className="hover:border-primary/50 border-2 border-transparent rounded-xl"
        >
          <MediaCard media={item} withType={withType} />
        </div>
      ))}
      {isLoading &&
        Array.from({ length: 20 }, (_, i) => (
          <Skeleton key={`skeleton-${i.toString()}`} className="aspect-2/3 w-full rounded-md" />
        ))}
    </div>
  );
}
