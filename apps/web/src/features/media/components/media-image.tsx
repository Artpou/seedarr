import type { Media } from "@seedarr/sdk";
import { FilmIcon, TvIcon } from "lucide-react";

import { Img, type ImgProps } from "@/shared/ui/image";

import {
  type BackdropFormat,
  getBackdropUrl,
  getPosterUrl,
  type PosterFormat,
} from "@/features/media/helpers/media.helper";

interface MediaImgBaseProps extends Omit<ImgProps, "fallback" | "src"> {
  media: Media;
}

interface MediaImgPosterProps extends MediaImgBaseProps {
  type?: "poster";
  w?: PosterFormat;
}

interface MediaImgBackdropProps extends MediaImgBaseProps {
  type: "backdrop";
  w?: BackdropFormat;
}

type MediaImgProps = MediaImgBackdropProps | MediaImgPosterProps;

export function MediaImg({ media, type, w, ...props }: MediaImgProps) {
  const src = type === "backdrop" ? getBackdropUrl(media.backdrop_path, w) : getPosterUrl(media.poster_path, w);

  return (
    <Img
      src={src}
      fallback={
        <div className="relative flex size-full aspect-2/3 flex-col items-center justify-center gap-3 overflow-hidden bg-card p-4 text-center select-none">
          <div className="absolute inset-0 bg-linear-to-bl from-primary/20 via-transparent to-card/30 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 shadow-inner">
              {media.type === "movie" ? (
                <FilmIcon className="size-8 text-card-foreground" />
              ) : (
                <TvIcon className="size-8 text-card-foreground" />
              )}
            </div>

            <span className="text-sm font-medium line-clamp-3 text-card-foreground">{media.title}</span>
          </div>
        </div>
      }
      {...props}
    />
  );
}
