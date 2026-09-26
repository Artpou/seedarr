import type * as React from "react";
import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
import type { LucideIcon } from "lucide-react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import { Carousel, CarouselContent, CarouselNext, CarouselPrevious } from "@/shared/ui/carousel";
import { SectionHeading } from "@/shared/ui/section-heading";

type CarouselWrapperProps = Omit<React.ComponentProps<typeof Carousel>, "title"> & {
  title?: ReactNode;
  titleIcon?: LucideIcon;
  seeMoreTo?: string;
  seeMoreSearch?: Record<string, unknown>;
  children: React.ReactNode;
};

export function CarouselWrapper({
  title,
  titleIcon,
  seeMoreTo,
  seeMoreSearch,
  children,
  ...props
}: CarouselWrapperProps) {
  const isMobile = useIsMobile();
  const heading = titleIcon != null ? <SectionHeading icon={titleIcon}>{title}</SectionHeading> : title;

  return (
    <Carousel
      {...props}
      opts={{
        align: "start",
        dragFree: true,
        ...props.opts,
      }}
      plugins={[WheelGesturesPlugin()]}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="min-w-0 flex-1 text-lg font-medium">{heading}</h2>
        {(seeMoreTo || !isMobile) && (
          <div className="flex items-center gap-2">
            {seeMoreTo && (
              <Button variant="secondary" size={!isMobile ? "sm" : "default"} asChild>
                <Link to={seeMoreTo} search={seeMoreSearch}>
                  <Trans>See more</Trans>
                </Link>
              </Button>
            )}
            {!isMobile && <CarouselPrevious className="static h-8 w-8 translate-y-0" />}
            {!isMobile && <CarouselNext className="static h-8 w-8 translate-y-0" />}
          </div>
        )}
      </div>

      <div className="relative">
        <CarouselContent>{children}</CarouselContent>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-background to-transparent"
          aria-hidden
        />
      </div>
    </Carousel>
  );
}
