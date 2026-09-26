import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/shared/ui/skeleton";

export function MediaDetailsViewSkeleton() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div>
        <div className="relative w-full py-0">
          <Container className="relative flex flex-col gap-4">
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="aspect-video w-full rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>

            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <div className="flex gap-3 pt-2">
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="size-12 rounded-full" />
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full py-0 sm:py-6">
        <div className="absolute inset-0 -z-10 h-[50vh] w-full">
          <Skeleton className="size-full rounded-none" />
          <div className="absolute inset-0 bg-linear-to-b from-background via-background/85 to-background" />
        </div>

        <Container className="relative flex flex-col sm:gap-6">
          <div className="grid grid-cols-1 items-start gap-4 sm:gap-8 lg:grid-cols-4 xl:grid-cols-5">
            <aside className="lg:col-span-1">
              <div className="mx-auto flex w-full max-w-[250px] flex-col gap-2 lg:mx-0">
                <Skeleton className="aspect-2/3 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </aside>

            <div className="flex lg:col-span-3 xl:col-span-4">
              <div className="flex w-full min-w-0 flex-col gap-6">
                <div className="flex">
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <Skeleton className="h-10 w-3/4 max-w-md rounded-md" />
                    <Skeleton className="h-4 w-1/2 max-w-xs rounded-md" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-36 rounded-md" />
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      <Skeleton className="h-4 w-1/4 rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-5/6 rounded-md" />
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-4 flex flex-col gap-2">
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-11 w-30 rounded-md" />
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-11 w-30 rounded-md" />
                      </div>
                    </div>
                  </div>

                  <aside className="ml-6 hidden min-w-56 flex-col gap-6 xl:flex">
                    <div className="flex gap-3">
                      <Skeleton className="size-12 rounded-full" />
                      <Skeleton className="size-12 rounded-full" />
                      <Skeleton className="size-12 rounded-full" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
