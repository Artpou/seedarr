import { type ReactNode, useMemo } from "react";

import type { Media } from "@seedarr/sdk";
import { useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { handleSafeClick } from "@/shared/helpers/button.helper";
import { CarouselItem } from "@/shared/ui/carousel";
import { CarouselSeeMoreSlide } from "@/shared/ui/carousel-see-more-slide";
import { CarouselWrapper } from "@/shared/ui/carousel-wrapper";
import {
  carouselMediaFocusKey,
  carouselSectionKey,
  carouselSeeMoreSearchKey,
} from "@/shared/ui/tv/tv-carousel-context";

import { MediaCard } from "@/features/media/components/card/media-card";

const MAX_ITEMS = 20;

interface MediaCarouselProps {
  title: string | ReactNode;
  titleIcon?: LucideIcon;
  data: Media[];
  seeMoreTo?: string;
  seeMoreSearch?: Record<string, unknown>;
  showType?: boolean;
  tvBarUpFocusKey?: string;
  onTvItemFocused?: (media: Media) => void;
  tvSelectedMedia?: Media | null;
}

export function MediaCarousel({
  title,
  titleIcon,
  data,
  seeMoreTo,
  seeMoreSearch,
  showType,
  tvBarUpFocusKey,
  onTvItemFocused,
  tvSelectedMedia,
}: MediaCarouselProps) {
  const navigate = useNavigate();

  const displayedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueMap = new Map(data.map((item) => [item.id, item]));
    return Array.from(uniqueMap.values()).slice(0, MAX_ITEMS);
  }, [data]);

  if (!data || displayedData.length === 0) return null;

  const seeMoreSearchKey = carouselSeeMoreSearchKey(seeMoreSearch);
  const sectionKey = carouselSectionKey(seeMoreTo ?? "inline", seeMoreSearchKey);
  const tvFirstSlideFocusKey = carouselMediaFocusKey(sectionKey, displayedData[0]);

  return (
    <CarouselWrapper
      title={title}
      titleIcon={titleIcon}
      seeMoreTo={seeMoreTo}
      seeMoreSearch={seeMoreSearch}
      tvFirstSlideFocusKey={tvFirstSlideFocusKey}
      tvBarUpFocusKey={tvBarUpFocusKey}
    >
      {displayedData.map((item, index) => (
        <CarouselItem
          key={item.id}
          slideIndex={index}
          className="cursor-pointer"
          onClick={(e) =>
            handleSafeClick(e, () => {
              if (item.download?.id) {
                navigate({ to: "/downloads/$id/play", params: { id: item.download.id } });
              }
            })
          }
        >
          <MediaCard
            media={item}
            showPreview
            showPlay
            showSocial
            showType={showType}
            onTvFocused={onTvItemFocused}
            tvHighlighted={
              tvSelectedMedia != null && tvSelectedMedia.id === item.id && tvSelectedMedia.type === item.type
            }
            tvBarUpFocusKey={tvBarUpFocusKey}
          />
        </CarouselItem>
      ))}
      {seeMoreTo && (
        <CarouselSeeMoreSlide
          seeMoreTo={seeMoreTo}
          seeMoreSearch={seeMoreSearch}
          slideIndex={displayedData.length}
          extraCount={Math.max(0, data.length - displayedData.length)}
        />
      )}
    </CarouselWrapper>
  );
}
