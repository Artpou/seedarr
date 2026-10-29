import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";

import { cn } from "@/lib/utils";
import { Flag } from "@/shared/components/flag";
import { Badge } from "@/shared/ui/badge";

import { MediaBadgeDate } from "@/features/media/components/badge/media-badge-date";
import { MediaBadgeRating } from "@/features/media/components/badge/media-badge-rating";
import { MediaBadgeRuntime } from "@/features/media/components/badge/media-badge-runtime";
import { MediaImg } from "@/features/media/components/media-image";
import { getBackdropUrl, getPosterUrl } from "@/features/media/helpers/media.helper";

/** Fixed TV preview strip height — must not change between titles. */
const TV_MEDIA_PREVIEW_PANEL_CLASS = "h-[17.5rem] shrink-0";

type TvMediaPreviewPanelProps = {
  media: Media | null;
  className?: string;
  emptyLabel?: ReactNode;
};

/** Display-only Plex-style preview (not focusable in spatial nav). */
export function TvMediaPreviewPanel({ media, className, emptyLabel }: TvMediaPreviewPanelProps) {
  if (!media) {
    return (
      <div
        data-slot="tv-media-preview"
        className={cn(
          TV_MEDIA_PREVIEW_PANEL_CLASS,
          "relative flex w-full items-center justify-center bg-muted/20",
          className,
        )}
        aria-hidden
      >
        <p className="text-muted-foreground">{emptyLabel ?? <Trans>Browse titles below</Trans>}</p>
      </div>
    );
  }

  const categories = media.categories?.split(", ").filter(Boolean) ?? [];
  const backdrop = getBackdropUrl(media.backdrop_path, "w1280") || getPosterUrl(media.poster_path, "w780");
  const showRating = !!media.vote_average && media.vote_average > 0;

  return (
    <section
      data-slot="tv-media-preview"
      className={cn(
        TV_MEDIA_PREVIEW_PANEL_CLASS,
        "relative overflow-hidden pointer-events-none select-none",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: backdrop ? `url(${backdrop})` : undefined }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-background via-background/92 to-background/55" />
      <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-background/40" />

      <div className="relative flex h-full gap-5 px-6 py-4 md:gap-7 md:px-8">
        <div className="relative hidden aspect-[2/3] h-full w-auto shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-border/80 sm:block">
          <MediaImg media={media} type="poster" className="h-full w-full object-cover object-top" />
          {showRating ? (
            <div className="absolute top-2 left-2">
              <MediaBadgeRating media={media} onlyOne />
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 py-0.5">
          <div className="min-w-0 shrink-0 space-y-0.5">
            <h1 className="truncate text-2xl font-bold leading-tight tracking-tight md:text-[1.65rem]">
              {media.title}
            </h1>
            {media.original_title && media.original_title !== media.title ? (
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
                {media.original_language ? <Flag lang={media.original_language} /> : null}
                <span className="truncate">{media.original_title}</span>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <MediaBadgeDate date={media.release_date} size="lg" variant="glass" />
            <MediaBadgeRuntime minutes={media.duration ?? undefined} size="lg" variant="glass" />
            {media.download?.quality ? <Badge variant="glass">{media.download.quality}</Badge> : null}
            {media.type === "tv" && media.seasons_number ? (
              <Badge variant="glass" className="text-sm">
                <Trans>{media.seasons_number} seasons</Trans>
              </Badge>
            ) : null}
          </div>

          {categories.length > 0 ? (
            <div className="flex shrink-0 flex-wrap gap-1.5 overflow-hidden">
              {categories.slice(0, 4).map((category) => (
                <Badge key={category} variant="secondary" className="max-w-[8rem] truncate">
                  {category}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="h-6 shrink-0" aria-hidden />
          )}

          <p className="mt-auto min-h-0 flex-1 text-sm leading-snug text-muted-foreground line-clamp-3 md:text-[0.9375rem]">
            {media.overview ?? ""}
          </p>
        </div>
      </div>
    </section>
  );
}
