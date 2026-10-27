import { useCallback } from "react";

import { useCarouselApiOptional } from "@/shared/ui/carousel";
import { useTvCarouselSlideIndex } from "@/shared/ui/tv/tv-carousel-context";

/** Scroll the parent Embla carousel when this slide receives TV focus. */
export function useTvCarouselEmblaScroll(): (() => void) | undefined {
  const slideIndex = useTvCarouselSlideIndex();
  const api = useCarouselApiOptional();

  return useCallback(() => {
    if (slideIndex === undefined || !api) return;
    api.scrollTo(slideIndex, false);
  }, [api, slideIndex]);
}
