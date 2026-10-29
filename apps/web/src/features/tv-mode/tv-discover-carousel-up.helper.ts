import type { Media } from "@seedarr/sdk";

import {
  carouselMediaFocusKey,
  carouselSectionKey,
  carouselSeeMoreSearchKey,
} from "@/shared/ui/tv/tv-carousel-context";

/** First poster focus key in a discover carousel row. */
export function tvCarouselRowFirstFocusKey(
  seeMoreTo: string,
  seeMoreSearch: Record<string, unknown> | undefined,
  item: Media | undefined,
): string | undefined {
  if (!item) return undefined;
  const searchKey = carouselSeeMoreSearchKey(seeMoreSearch);
  return carouselMediaFocusKey(carouselSectionKey(seeMoreTo, searchKey), item);
}
