import { Skeleton } from "@/components/ui/skeleton";

export function MovieDetailsSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section Skeleton */}
      <div className="relative h-72">
        {/* Background Skeleton */}
        <div className="absolute inset-0 bg-muted/20">
          <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/40 to-background" />
          <div className="absolute inset-0 bg-linear-to-r from-destructive/40 to-black/60" />
        </div>

        {/* Banner Content Skeleton */}
        <div className="relative z-10 px-6 md:px-12 h-full flex flex-col justify-end pb-10 w-full">
          <div className="flex flex-col md:flex-row gap-10 items-end">
            {/* Poster Skeleton */}
            <div className="hidden md:block w-40 translate-y-20 shrink-0">
              <Skeleton className="aspect-2/3 w-full rounded-sm border border-white/20 shadow-2xl" />
              <Skeleton className="w-full mt-2 h-12 rounded-sm" />
            </div>

            {/* Info Skeleton */}
            <div className="flex-1 space-y-4 pb-6">
              <div className="space-y-2">
                <Skeleton className="h-10 w-2/3" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>

              {/* Stats Skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-6 md:px-12 mt-20 flex flex-col gap-12 w-full">
        <div className="space-y-10">
          {/* Metadata Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Torrents List Skeleton */}
          <div className="space-y-6 border-t border-border pt-10 pb-20 w-full">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index.toString()} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
