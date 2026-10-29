import type * as React from "react";
import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { Link, useNavigate } from "@tanstack/react-router";
import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
import type { LucideIcon } from "lucide-react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import { Carousel, CarouselContent, CarouselEdgeFades, CarouselNext, CarouselPrevious } from "@/shared/ui/carousel";
import { SectionHeading } from "@/shared/ui/section-heading";
import { carouselSectionKey, carouselSeeMoreSearchKey, TvCarouselSection } from "@/shared/ui/tv/tv-carousel-context";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { tvSeeMoreFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

type CarouselWrapperProps = Omit<React.ComponentProps<typeof Carousel>, "title"> & {
  title?: ReactNode;
  titleIcon?: LucideIcon;
  seeMoreTo?: string;
  seeMoreSearch?: Record<string, unknown>;
  /** First slide focus key — ArrowDown from See more lands here instead of the rightmost visible card. */
  tvFirstSlideFocusKey?: string;
  /** ArrowUp from See more (e.g. first row → topbar Movies). */
  tvBarUpFocusKey?: string;
  children: React.ReactNode;
};

export function CarouselWrapper({
  title,
  titleIcon,
  seeMoreTo,
  seeMoreSearch,
  tvFirstSlideFocusKey,
  tvBarUpFocusKey,
  children,
  ...props
}: CarouselWrapperProps) {
  const isMobile = useIsMobile();
  const tvMode = useTvMode();
  const navigate = useNavigate();
  const showCarouselArrows = !isMobile && !tvMode;
  const heading = titleIcon != null ? <SectionHeading icon={titleIcon}>{title}</SectionHeading> : title;

  const seeMoreSearchKey = carouselSeeMoreSearchKey(seeMoreSearch);

  const sectionKey = carouselSectionKey(seeMoreTo ?? "inline", seeMoreSearchKey);

  return (
    <TvCarouselSection sectionKey={sectionKey}>
      <div data-slot="tv-carousel-section">
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
            {(seeMoreTo && !tvMode) || showCarouselArrows ? (
              <div className="flex items-center gap-2">
                {seeMoreTo && !tvMode && (
                  <TvFocusable
                    focusRoot
                    className="inline-flex shrink-0 rounded-md"
                    tv={{
                      focusKey: tvSeeMoreFocusKey(seeMoreTo, seeMoreSearchKey),
                      onPress: () => navigate({ to: seeMoreTo, search: seeMoreSearch ?? {} }),
                      accessibilityLabel: "See more",
                      onArrowPress: (direction) => {
                        if (direction === "up" && tvBarUpFocusKey) {
                          setFocus(tvBarUpFocusKey);
                          return false;
                        }
                        if (direction === "down" && tvFirstSlideFocusKey) {
                          setFocus(tvFirstSlideFocusKey);
                          return false;
                        }
                        return true;
                      },
                    }}
                  >
                    <Button variant="secondary" size={!isMobile ? "sm" : "default"} asChild>
                      <Link to={seeMoreTo} search={seeMoreSearch}>
                        <Trans>See more</Trans>
                      </Link>
                    </Button>
                  </TvFocusable>
                )}
                {showCarouselArrows && <CarouselPrevious className="static h-8 w-8 translate-y-0" />}
                {showCarouselArrows && <CarouselNext className="static h-8 w-8 translate-y-0" />}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <CarouselContent>{children}</CarouselContent>
            <CarouselEdgeFades />
          </div>
        </Carousel>
      </div>
    </TvCarouselSection>
  );
}
