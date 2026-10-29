import { useMemo } from "react";

import { Trans } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import { DownloadIcon } from "lucide-react";

import { useAuth } from "@/features/auth/auth-store";
import { MediaCarouselHorizontal } from "@/features/media/components/carousel/media-carousel-horizontal";
import { sortDownloadedLibraryCarousel } from "@/features/media/helpers/media.helper";
import { useSuspenseMediaLibrary } from "@/features/media/hooks/use-media";
import { tvNavPrimaryFocusKey } from "@/features/tv-mode/tv-focus-keys";

interface MediaCarouselWatchingProps {
  type: Media["type"];
  onTvItemFocused?: (media: Media) => void;
  tvSelectedMedia?: Media | null;
  tvBarUpFocusKey?: string;
}

export function MediaCarouselWatching({
  type,
  onTvItemFocused,
  tvSelectedMedia,
  tvBarUpFocusKey,
}: MediaCarouselWatchingProps) {
  const authUser = useAuth((s) => s.user);

  const { data: items } = useSuspenseMediaLibrary(type);
  const sortedItems = useMemo(() => sortDownloadedLibraryCarousel(items), [items]);
  if (sortedItems.length === 0 || !authUser) return null;

  return (
    <MediaCarouselHorizontal
      medias={sortedItems}
      seeMoreTo="/downloads"
      tvBarUpFocusKey={tvBarUpFocusKey ?? tvNavPrimaryFocusKey(type)}
      titleIcon={DownloadIcon}
      title={<Trans>Downloaded</Trans>}
      onTvItemFocused={onTvItemFocused}
      tvSelectedMedia={tvSelectedMedia}
    />
  );
}
