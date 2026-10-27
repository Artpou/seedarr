import { createContext, type ReactNode, useContext } from "react";

import { FocusContext, useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import type { Media } from "@seedarr/sdk";

import { tvMediaFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

const TvCarouselSectionContext = createContext<string | undefined>(undefined);
const TvCarouselSlideIndexContext = createContext<number | undefined>(undefined);

export function carouselSeeMoreSearchKey(seeMoreSearch?: Record<string, unknown>): string | undefined {
  if (seeMoreSearch && typeof seeMoreSearch.type === "string") return seeMoreSearch.type;
  if (seeMoreSearch && typeof seeMoreSearch.genre === "string") return seeMoreSearch.genre;
  return undefined;
}

export function carouselSectionKey(seeMoreTo: string, seeMoreSearchKey?: string): string {
  return `CAROUSEL-${seeMoreTo}-${seeMoreSearchKey ?? "main"}`;
}

export function carouselMediaFocusKey(sectionKey: string, media: Pick<Media, "id" | "type">): string {
  return `${sectionKey}::${tvMediaFocusKey(media)}`;
}

function useTvCarouselSectionKey(): string | undefined {
  return useContext(TvCarouselSectionContext);
}

export function useTvMediaFocusKey(media: Pick<Media, "id" | "type">): string {
  const section = useTvCarouselSectionKey();
  if (!section) return tvMediaFocusKey(media);
  return carouselMediaFocusKey(section, media);
}

export function useTvCarouselSlideIndex(): number | undefined {
  return useContext(TvCarouselSlideIndexContext);
}

export function TvCarouselSlideIndex({ index, children }: { index?: number; children: ReactNode }) {
  return <TvCarouselSlideIndexContext.Provider value={index}>{children}</TvCarouselSlideIndexContext.Provider>;
}

/** One discover row: unique focus namespace + spatial child tree. */
export function TvCarouselSection({ sectionKey, children }: { sectionKey: string; children: ReactNode }) {
  const tvMode = useTvMode();
  const { ref, focusKey } = useFocusable({
    focusKey: sectionKey,
    focusable: tvMode,
    trackChildren: true,
  });

  return (
    <TvCarouselSectionContext.Provider value={sectionKey}>
      {tvMode ? (
        <FocusContext.Provider value={focusKey}>
          <div ref={ref}>{children}</div>
        </FocusContext.Provider>
      ) : (
        children
      )}
    </TvCarouselSectionContext.Provider>
  );
}
