import { Trans } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, LayoutGridIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";
import { CarouselItem } from "@/shared/ui/carousel";
import { carouselSeeMoreSearchKey } from "@/shared/ui/tv/tv-carousel-context";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { tvSeeMoreCarouselFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

type CarouselSeeMoreSlideProps = {
  seeMoreTo: string;
  seeMoreSearch?: Record<string, unknown>;
  slideIndex: number;
  layout?: "poster" | "wide";
  className?: string;
  /** Shown as “+N” when the row truncates items before this slide. */
  extraCount?: number;
};

export function CarouselSeeMoreSlide({
  seeMoreTo,
  seeMoreSearch,
  slideIndex,
  layout = "poster",
  className,
  extraCount,
}: CarouselSeeMoreSlideProps) {
  const navigate = useNavigate();
  const tvMode = useTvMode();
  const searchKey = carouselSeeMoreSearchKey(seeMoreSearch);

  const go = (): void => {
    navigate({ to: seeMoreTo, search: seeMoreSearch ?? {} });
  };

  const label = <Trans>See more</Trans>;

  const tile = (
    <Card
      data-slot="carousel-see-more"
      className={cn(
        "group relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden border-2 border-dashed border-primary/35 bg-linear-to-br from-primary/20 via-card to-muted/40 p-4 text-center shadow-none transition-colors hover:border-primary/60 hover:from-primary/25",
        layout === "poster" && "aspect-2/3",
        layout === "wide" && "min-h-[140px] sm:min-h-[160px]",
      )}
      onClick={tvMode ? undefined : go}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, var(--primary) 0%, transparent 55%),
            radial-gradient(circle at 80% 80%, var(--primary) 0%, transparent 45%)`,
        }}
        aria-hidden
      />
      <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/40 transition-transform duration-200 group-hover:scale-105 group-hover:bg-primary/25">
        {layout === "poster" ? (
          <LayoutGridIcon className="size-7 text-primary" aria-hidden />
        ) : (
          <ArrowRightIcon className="size-7 text-primary" aria-hidden />
        )}
      </div>
      <div className="relative flex flex-col items-center gap-1">
        <span className="text-sm font-semibold leading-tight text-foreground">{label}</span>
        {extraCount != null && extraCount > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            <Trans>+{extraCount} titles</Trans>
          </span>
        )}
      </div>
    </Card>
  );

  const body = tvMode ? (
    <TvFocusable
      focusRoot
      className="block h-full w-full rounded-xl"
      tv={{
        focusKey: tvSeeMoreCarouselFocusKey(seeMoreTo, searchKey),
        onPress: go,
        accessibilityLabel: "See more",
      }}
    >
      {tile}
    </TvFocusable>
  ) : (
    tile
  );

  return (
    <CarouselItem slideIndex={slideIndex} layout={layout} className={cn("cursor-pointer", className)}>
      {body}
    </CarouselItem>
  );
}
