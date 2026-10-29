import { type ReactNode, useMemo } from "react";

import type { Media } from "@seedarr/sdk";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { CarouselItem } from "@/shared/ui/carousel";
import { CarouselSeeMoreSlide } from "@/shared/ui/carousel-see-more-slide";
import { CarouselWrapper } from "@/shared/ui/carousel-wrapper";
import {
  carouselMediaFocusKey,
  carouselSectionKey,
  carouselSeeMoreSearchKey,
} from "@/shared/ui/tv/tv-carousel-context";

import { MediaCardHorizontal } from "@/features/media/components/card/media-card-horizontal";
import { getRemainingTime, getWatchProgressPercent, hasWatchProgress } from "@/features/media/helpers/media.helper";
import { preloadMoviPlayer } from "@/features/player/helpers/movi-player.helper";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

const MAX_ITEMS = 20;

const HORIZONTAL_SLIDE_CLASS = "w-auto basis-[85%] sm:basis-[55%] md:basis-[42%] lg:basis-[34%] xl:basis-[28%]";

interface MediaCarouselHorizontalProps {
  title: string | ReactNode;
  titleIcon?: LucideIcon;
  medias: Media[];
  seeMoreTo?: string;
  seeMoreSearch?: Record<string, unknown>;
  tvBarUpFocusKey?: string;
  onTvItemFocused?: (media: Media) => void;
  tvSelectedMedia?: Media | null;
}

export function MediaCarouselHorizontal({
  title,
  titleIcon,
  medias,
  seeMoreTo,
  seeMoreSearch,
  tvBarUpFocusKey,
  onTvItemFocused,
  tvSelectedMedia,
}: MediaCarouselHorizontalProps) {
  const _tvMode = useTvMode();
  const uniqueMedias = useMemo(() => {
    if (!medias || medias.length === 0) return [];
    const uniqueMap = new Map(medias.map((item) => [item.id, item]));
    return Array.from(uniqueMap.values()).slice(0, MAX_ITEMS);
  }, [medias]);

  if (!medias || uniqueMedias.length === 0) return null;

  const seeMoreSearchKey = carouselSeeMoreSearchKey(seeMoreSearch);
  const sectionKey = carouselSectionKey(seeMoreTo ?? "inline", seeMoreSearchKey);
  const tvFirstSlideFocusKey = carouselMediaFocusKey(sectionKey, uniqueMedias[0]);

  return (
    <CarouselWrapper
      title={title}
      titleIcon={titleIcon}
      seeMoreTo={seeMoreTo}
      seeMoreSearch={seeMoreSearch}
      tvFirstSlideFocusKey={tvFirstSlideFocusKey}
      tvBarUpFocusKey={tvBarUpFocusKey}
    >
      {uniqueMedias.map((item, index) => (
        <CarouselItem
          key={item.id}
          slideIndex={index}
          layout="wide"
          className={HORIZONTAL_SLIDE_CLASS}
          onMouseEnter={item.download?.id ? preloadMoviPlayer : undefined}
          onFocus={item.download?.id ? preloadMoviPlayer : undefined}
          onPointerDown={item.download?.id ? preloadMoviPlayer : undefined}
        >
          <div className="h-full">
            <MediaCardHorizontal
              media={item}
              className="h-full"
              onTvFocused={onTvItemFocused}
              tvHighlighted={
                tvSelectedMedia != null && tvSelectedMedia.id === item.id && tvSelectedMedia.type === item.type
              }
              tvBarUpFocusKey={tvBarUpFocusKey}
            >
              <div className="flex items-end justify-between gap-1">
                {getRemainingTime(item) && <Badge variant="secondary">{getRemainingTime(item)}</Badge>}
              </div>

              {hasWatchProgress(item) && (
                <>
                  <div
                    className="absolute left-0 bottom-0 h-1.5 bg-primary rounded-r-md"
                    style={{ width: `${getWatchProgressPercent(item)}%` }}
                  />
                  <div className="w-full absolute left-0 bottom-0 h-1.5 bg-primary/40" />
                </>
              )}
            </MediaCardHorizontal>
          </div>
        </CarouselItem>
      ))}
      {seeMoreTo && (
        <CarouselSeeMoreSlide
          seeMoreTo={seeMoreTo}
          seeMoreSearch={seeMoreSearch}
          slideIndex={uniqueMedias.length}
          layout="wide"
          className={HORIZONTAL_SLIDE_CLASS}
          extraCount={Math.max(0, medias.length - uniqueMedias.length)}
        />
      )}
    </CarouselWrapper>
  );
}
