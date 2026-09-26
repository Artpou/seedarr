import { Skeleton } from "@/shared/ui/skeleton";

export function MediaGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(165px,1fr))] gap-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={`skeleton-${i.toString()}`} className="aspect-2/3 w-full rounded-md" />
      ))}
    </div>
  );
}
