import { useEffect, useState } from "react";

import type { Media } from "@seedarr/sdk";

export function pickFirstMedia(candidates: (Media | null | undefined)[]): Media | null {
  for (const item of candidates) {
    if (item) return item;
  }
  return null;
}

function isSameMedia(a: Media, b: Media): boolean {
  return a.id === b.id && a.type === b.type;
}

/** Keeps TV preview media in sync when focus or catalog changes. */
export function useTvPreviewMedia(
  defaultMedia: Media | null,
  pool: Media[] = [],
): {
  previewMedia: Media | null;
  setPreviewMedia: (media: Media) => void;
} {
  const [focusedMedia, setFocusedMedia] = useState<Media | null>(null);

  useEffect(() => {
    if (pool.length === 0) {
      setFocusedMedia(null);
      return;
    }
    setFocusedMedia((current) => {
      if (current && pool.some((item) => isSameMedia(item, current))) return current;
      return pool[0] ?? defaultMedia;
    });
  }, [pool, defaultMedia]);

  const previewMedia = focusedMedia ?? defaultMedia ?? pool[0] ?? null;

  return {
    previewMedia,
    setPreviewMedia: setFocusedMedia,
  };
}
