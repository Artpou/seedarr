import { useState } from "react";

import { t } from "@lingui/core/macro";
import type { Media } from "@seedarr/sdk";
import { ClockPlusIcon, HeartIcon, StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

import { MediaReview } from "@/features/media/components/media-review";
import { useToggleLike, useToggleWatchList } from "@/features/media/hooks/media.queries";
import { tvMediaLikeFocusKey, tvMediaReviewFocusKey, tvMediaWatchlistFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

interface MediaSocialActionsProps {
  media: Media;
  className?: string;
  size?: "lg" | "xl";
}

/** Like + watchlist only. User rating lives in MediaRatingUser on detail pages. */
export function MediaSocialActions({ media, className, size = "xl" }: MediaSocialActionsProps) {
  const tvMode = useTvMode();
  const toggleLike = useToggleLike();
  const toggleWatchList = useToggleWatchList();
  const iconSize = size === "lg" ? "icon-lg" : "icon-xl";

  const [open, setOpen] = useState(false);

  const mediaType = media.type === "tv" ? "tv" : "movie";

  return (
    <div className={cn("flex flex-row gap-3", className)}>
      <Button
        size={iconSize}
        variant={media.userScore != null ? "default" : "secondary"}
        rounded
        onClick={() => setOpen(true)}
        aria-label={t`Review`}
        tv={
          tvMode
            ? {
                focusKey: tvMediaReviewFocusKey(media.id, mediaType),
                onPress: () => setOpen(true),
                accessibilityLabel: t`Review`,
              }
            : undefined
        }
      >
        <StarIcon className={cn(media.userScore != null && "fill-white")} />
      </Button>
      <Button
        size={iconSize}
        variant={media.liked ? "default" : "secondary"}
        rounded
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleLike.mutate(media);
        }}
        aria-label={t`Like`}
        tv={
          tvMode
            ? {
                focusKey: tvMediaLikeFocusKey(media.id, mediaType),
                onPress: () => toggleLike.mutate(media),
                accessibilityLabel: t`Like`,
              }
            : undefined
        }
      >
        <HeartIcon className={cn(media.liked && "fill-white")} />
      </Button>
      <Button
        size={iconSize}
        variant={media.inWatchList ? "default" : "secondary"}
        rounded
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWatchList.mutate(media);
        }}
        aria-label={t`Watchlist`}
        tv={
          tvMode
            ? {
                focusKey: tvMediaWatchlistFocusKey(media.id, mediaType),
                onPress: () => toggleWatchList.mutate(media),
                accessibilityLabel: t`Watchlist`,
              }
            : undefined
        }
      >
        <ClockPlusIcon className={cn(media.inWatchList && "text-white")} />
      </Button>
      <MediaReview media={media} open={open} onOpenChange={setOpen} />
    </div>
  );
}
