import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/shared/ui/skeleton";

const SECTION_COUNT = 3;
const POSTER_COUNT = 8;

function DiscoverPosterSkeleton() {
  return (
    <div className="relative w-[165px] shrink-0 grow-0 sm:w-[176px]">
      <Skeleton className="aspect-2/3 w-full rounded-xl" />
      <Skeleton className="absolute top-2 left-2 h-5 w-11 rounded-full" />
    </div>
  );
}

function DiscoverSectionSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className={`rounded-md ${isMobile ? "h-9 w-22" : "h-8 w-22"}`} />
          {!isMobile && (
            <>
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </>
          )}
        </div>
      </div>
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: POSTER_COUNT }, (_, i) => (
          <DiscoverPosterSkeleton key={`poster-${i.toString()}`} />
        ))}
      </div>
    </div>
  );
}

export function MediaDiscoverViewSkeleton() {
  const isMobile = useIsMobile();

  return (
    <Container className="space-y-8">
      {Array.from({ length: SECTION_COUNT }, (_, i) => (
        <DiscoverSectionSkeleton key={`section-${i.toString()}`} isMobile={isMobile} />
      ))}
    </Container>
  );
}
