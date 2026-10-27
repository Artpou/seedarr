import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import type { MediaRequest } from "@seedarr/sdk";
import { BellRingIcon, type LucideIcon } from "lucide-react";

import { CarouselItem } from "@/shared/ui/carousel";
import { CarouselSeeMoreSlide } from "@/shared/ui/carousel-see-more-slide";
import { CarouselWrapper } from "@/shared/ui/carousel-wrapper";

import { RequestCard } from "./request-card";

interface RequestCarouselProps {
  requests: MediaRequest[];
  title?: ReactNode;
  titleIcon?: LucideIcon;
  seeMoreTo?: string;
  seeMoreSearch?: Record<string, unknown>;
  tvBarUpFocusKey?: string;
}

export function RequestCarousel({
  requests,
  title,
  titleIcon,
  seeMoreTo,
  seeMoreSearch,
  tvBarUpFocusKey,
}: RequestCarouselProps) {
  if (requests.length === 0) return null;

  const defaultTitle = <Trans>Pending Requests</Trans>;

  return (
    <CarouselWrapper
      title={title ?? defaultTitle}
      titleIcon={titleIcon ?? (title ? undefined : BellRingIcon)}
      seeMoreTo={seeMoreTo}
      seeMoreSearch={seeMoreSearch}
      tvBarUpFocusKey={tvBarUpFocusKey}
    >
      {requests.map((request, index) => (
        <CarouselItem
          key={request.id}
          slideIndex={index}
          layout="wide"
          className="w-auto basis-[85%] sm:basis-[55%] md:basis-[42%] lg:basis-[34%] xl:basis-[28%]"
        >
          <div className="h-full">
            <RequestCard request={request} />
          </div>
        </CarouselItem>
      ))}
      {seeMoreTo && (
        <CarouselSeeMoreSlide
          seeMoreTo={seeMoreTo}
          seeMoreSearch={seeMoreSearch}
          slideIndex={requests.length}
          layout="wide"
          className="w-auto basis-[85%] sm:basis-[55%] md:basis-[42%] lg:basis-[34%] xl:basis-[28%]"
        />
      )}
    </CarouselWrapper>
  );
}
