import { useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { Movie, TV } from "@seedarr/sdk";
import { FilmIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { useTvBackIntercept } from "@/features/tv-mode/tv-back-intercept";
import { tvTrailerFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

interface MediaButtonTrailerProps extends Omit<ButtonProps, "onClick"> {
  title: string;
  data: Movie | TV;
}

export function MediaButtonTrailer({ title, data, className, ...props }: MediaButtonTrailerProps) {
  const item = "movie" in data ? data.movie : data.tv;
  const media = data.media;
  const mediaType = "movie" in data ? "movie" : "tv";
  const { i18n, t } = useLingui();
  const tvMode = useTvMode();
  const [open, setOpen] = useState(false);

  useTvBackIntercept(tvMode && open, () => setOpen(false));

  const youtubeTrailer = useMemo(() => {
    const videos = item?.videos?.results;
    if (!videos) return null;

    return (
      videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.iso_3166_1 === i18n.locale) ??
      videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
      videos.find((v) => v.site === "YouTube")
    );
  }, [item?.videos, i18n.locale]);

  if (!youtubeTrailer || !media) return null;

  const iframe = (
    <iframe
      src={`https://www.youtube.com/embed/${youtubeTrailer.key}?autoplay=1`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full rounded-lg"
    />
  );

  if (tvMode) {
    return (
      <>
        <TvFocusable
          focusRoot
          tv={{
            focusKey: tvTrailerFocusKey(mediaType, media.id),
            onPress: () => setOpen(true),
            accessibilityLabel: t`Watch Trailer`,
          }}
        >
          <Button variant="secondary" className={cn(className)} icon={FilmIcon} {...props}>
            <Trans>Watch Trailer</Trans>
          </Button>
        </TvFocusable>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[90vw] max-w-[95vw] p-0 border-none aspect-video" showCloseButton={false}>
            {iframe}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        <Button variant="secondary" className={cn(className)} icon={FilmIcon} {...props}>
          <Trans>Watch Trailer</Trans>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] p-0 border-none aspect-video" showCloseButton={false}>
        {iframe}
      </DialogContent>
    </Dialog>
  );
}
