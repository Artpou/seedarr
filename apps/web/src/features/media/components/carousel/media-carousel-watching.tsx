import { Trans } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import { PlayCircleIcon } from "lucide-react";

import { useAuth } from "@/features/auth/auth-store";
import { MediaCarouselHorizontal } from "@/features/media/components/carousel/media-carousel-horizontal";
import { useSuspenseMediaInProgress } from "@/features/media/hooks/use-media";

interface MediaCarouselWatchingProps {
  type: Media["type"];
}

export function MediaCarouselWatching({ type }: MediaCarouselWatchingProps) {
  const authUser = useAuth((s) => s.user);

  const { data: items } = useSuspenseMediaInProgress(type);
  if (items.length === 0 || !authUser) return null;

  return (
    <MediaCarouselHorizontal
      medias={items}
      seeMoreTo="/downloads"
      titleIcon={PlayCircleIcon}
      title={<Trans>Resume watching</Trans>}
    />
  );
}
