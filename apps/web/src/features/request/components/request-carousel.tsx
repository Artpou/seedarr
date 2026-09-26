import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import type { MediaRequest } from "@seedarr/sdk";
import { BellRingIcon, type LucideIcon } from "lucide-react";

import { CarouselItem } from "@/shared/ui/carousel";
import { CarouselWrapper } from "@/shared/ui/carousel-wrapper";

import { RequestCard } from "./request-card";

interface RequestCarouselProps {
  requests: MediaRequest[];
  title?: ReactNode;
  titleIcon?: LucideIcon;
  seeMoreTo?: string;
  seeMoreSearch?: Record<string, unknown>;
}

export function RequestCarousel({ requests, title, titleIcon, seeMoreTo, seeMoreSearch }: RequestCarouselProps) {
  if (requests.length === 0) return null;

  const defaultTitle = <Trans>Pending Requests</Trans>;

  return (
    <CarouselWrapper
      title={title ?? defaultTitle}
      titleIcon={titleIcon ?? (title ? undefined : BellRingIcon)}
      seeMoreTo={seeMoreTo}
      seeMoreSearch={seeMoreSearch}
    >
      {requests.map((request) => (
        <CarouselItem
          key={request.id}
          className="basis-[85%] sm:basis-[55%] md:basis-[42%] lg:basis-[34%] xl:basis-[28%]"
        >
          <div className="h-full">
            <RequestCard request={request} />
          </div>
        </CarouselItem>
      ))}
    </CarouselWrapper>
  );
}
