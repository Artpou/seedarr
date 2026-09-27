import { Trans } from "@lingui/react/macro";
import type { Media, Movie } from "@seedarr/sdk";
import { LibraryIcon, SparklesIcon } from "lucide-react";

import { MediaCarousel } from "@/features/media/components/carousel/media-carousel";

interface MovieRelatedProps {
  collection: Movie["collection"];
  collectionMedia: Media[];
  recommendedMovies: Media[];
}

export function MovieRelated({ collection, collectionMedia, recommendedMovies }: MovieRelatedProps) {
  const hasCollection = collectionMedia.length > 0;
  const hasRecommendations = recommendedMovies.length > 0;

  if (!hasCollection && !hasRecommendations) return null;

  return (
    <>
      {hasCollection && (
        <MediaCarousel
          titleIcon={LibraryIcon}
          title={typeof collection?.name === "string" ? collection.name : <Trans>Collection</Trans>}
          data={collectionMedia}
        />
      )}
      {hasRecommendations && (
        <MediaCarousel titleIcon={SparklesIcon} title={<Trans>Recommended</Trans>} data={recommendedMovies} />
      )}
    </>
  );
}
