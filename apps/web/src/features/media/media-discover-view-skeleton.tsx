import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/shared/ui/skeleton";

import { MediaGridSkeleton } from "@/features/media/components/media-grid-skeletons";

export function MediaDiscoverViewSkeleton() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Container className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-7 w-36 rounded-md" />
          </div>
          <MediaGridSkeleton />
        </div>
      </Container>
    );
  }

  return (
    <Container className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-md mt-4" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="h-10 w-22 shrink-0 rounded-md" />
            <Skeleton className="h-11 w-120 rounded-md" />
          </div>
          <Skeleton className="h-9 w-26 shrink-0 rounded-md" />
        </div>
        <MediaGridSkeleton />
      </div>
    </Container>
  );
}
