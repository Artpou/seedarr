import type { MediaItem } from "@basement/api/types";
import { Trans } from "@lingui/react/macro";
import { MovieCard } from "@/components/movies/movie-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface MediaCarouselProps {
  title: string;
  data: MediaItem[];
  classname?: string;
  hideArrows?: boolean;
}

export function MediaCarousel({ title, data, classname, hideArrows = false }: MediaCarouselProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2>
        <Trans>{title}</Trans>
      </h2>
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className={cn(hideArrows && "-ml-4")}>
          {data.map((item, index) => (
            <CarouselItem
              key={item.id || index}
              className={cn("pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5 xl:basis-1/6", classname)}
            >
              <div className="p-1">
                <MovieCard movie={item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {!hideArrows && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </div>
  );
}
