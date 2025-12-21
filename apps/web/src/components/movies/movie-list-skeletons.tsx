import { Skeleton } from "@/components/ui/skeleton";

export function MovieListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i.toString()} className="flex items-center gap-3 p-2">
          <Skeleton className="size-12 rounded-sm shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-8 shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
