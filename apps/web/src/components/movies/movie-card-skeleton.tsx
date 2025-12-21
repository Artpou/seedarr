import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MovieCardSkeleton() {
  return (
    <Card className="overflow-hidden aspect-2/3 relative">
      <Skeleton className="size-full" />
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-background/95 via-background/80 to-transparent">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  );
}
