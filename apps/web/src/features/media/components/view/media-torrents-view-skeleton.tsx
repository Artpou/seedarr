import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/shared/ui/skeleton";

function HeroCardSkeleton({ isMobile }: { isMobile: boolean }) {
  const poster = <Skeleton className={`aspect-2/3 shrink-0 rounded-md ${isMobile ? "h-24 w-16" : "w-20"}`} />;

  const meta = (
    <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
      <Skeleton className={`rounded-md ${isMobile ? "h-4 w-3/4" : "h-5 w-1/2 max-w-xs"}`} />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12 rounded-md" />
        <Skeleton className="h-5 w-10 rounded-md" />
      </div>
      <Skeleton className={`h-3 rounded-md ${isMobile ? "w-full" : "w-[70%]"}`} />
      <Skeleton className={`h-3 rounded-md ${isMobile ? "w-full" : "w-[70%]"}`} />
      <Skeleton className={`h-3 rounded-md ${isMobile ? "w-5/6" : "w-[55%]"}`} />
    </div>
  );

  const actions = (
    <div className={`flex gap-3 ${isMobile ? "justify-center" : "shrink-0"}`}>
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="size-10 rounded-full" />
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col">
        <div className="overflow-hidden rounded-lg rounded-b-none bg-card/60 p-3">
          <div className="flex items-stretch gap-3">
            {poster}
            {meta}
          </div>
        </div>
        <div className="rounded-lg rounded-t-none bg-card p-3 h-18" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-card/60 p-4 h-39">
      <div className="flex items-stretch gap-4">
        {poster}
        <div className="flex min-w-0 flex-1 justify-between gap-2">
          {meta}
          {actions}
        </div>
      </div>
    </div>
  );
}

function FiltersSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className={`flex gap-3 py-2 ${isMobile ? "flex-col py-4" : "flex-row items-center sm:gap-4"}`}>
      <Skeleton className={`h-9 rounded-md ${isMobile ? "w-full h-10" : "w-36"}`} />
      <Skeleton className={`h-9 rounded-md ${isMobile ? "w-full h-10" : "w-30"}`} />
    </div>
  );
}

export function MediaTorrentsViewSkeleton() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Container>
        <HeroCardSkeleton isMobile />
        <FiltersSkeleton isMobile />
      </Container>
    );
  }

  return (
    <Container className="space-y-2!">
      <HeroCardSkeleton isMobile={false} />
      <FiltersSkeleton isMobile={false} />
      <Skeleton className="h-100 w-full rounded-md" />
    </Container>
  );
}
