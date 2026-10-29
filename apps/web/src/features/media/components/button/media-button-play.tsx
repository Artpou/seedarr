import { Trans, useLingui } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import { useNavigate } from "@tanstack/react-router";
import { PlayIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { TvFocusable, type TvFocusTarget } from "@/shared/ui/tv/tv-focusable";

import { getRemainingTime, getWatchProgressPercent, hasWatchProgress } from "@/features/media/helpers/media.helper";
import { preloadMoviPlayer } from "@/features/player/helpers/movi-player.helper";
import { tvPlayFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

interface MediaButtonPlayProps extends ButtonProps {
  media: Media;
  downloadId?: string;
  season?: number;
  episode?: number;
  circular?: boolean;
  iconOnly?: boolean;
  /** When false, episode rows own spatial focus (TV). */
  spatialNav?: boolean;
}

export const MediaButtonPlay = ({
  media,
  downloadId,
  season,
  episode,
  className,
  circular = false,
  iconOnly = false,
  spatialNav = true,
  ...props
}: MediaButtonPlayProps) => {
  const { t } = useLingui();
  const tvMode = useTvMode();
  const navigate = useNavigate();

  const playDownloadId = downloadId ?? media.download?.id;
  const showWatchProgress = hasWatchProgress(media) && media.progress?.downloadId === playDownloadId;
  const watchProgressPercent = getWatchProgressPercent(media);
  const remainingTime = getRemainingTime(media);

  const goPlay = () => {
    if (!playDownloadId) return;
    navigate({
      to: "/downloads/$id/play",
      params: { id: playDownloadId },
      search: season != null && episode != null ? { season, episode } : {},
    });
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goPlay();
  };

  const tv: TvFocusTarget | undefined =
    tvMode && playDownloadId && spatialNav
      ? { focusKey: tvPlayFocusKey(playDownloadId), onPress: goPlay, accessibilityLabel: t`Play` }
      : undefined;

  if (!playDownloadId) return null;

  if (circular) {
    const playControl = (
      <button
        type="button"
        className={cn("cursor-pointer", className)}
        onClick={handlePlay}
        onMouseEnter={preloadMoviPlayer}
        onFocus={preloadMoviPlayer}
        onPointerDown={preloadMoviPlayer}
        aria-label={t`Play`}
      >
        <span className="flex items-center justify-center size-16 rounded-full bg-primary/80 shadow-lg opacity-80 group-hover/poster:opacity-100 group-hover/poster:bg-primary group-hover/poster:scale-105 transition-all duration-300">
          <PlayIcon className="size-8 text-white fill-current ml-1" />
        </span>
      </button>
    );

    if (tv) {
      return (
        <TvFocusable focusRoot className={cn("inline-flex rounded-full", className)} tv={tv}>
          {playControl}
        </TvFocusable>
      );
    }

    return playControl;
  }

  const playActionLabel = showWatchProgress
    ? t`Resume`
    : media.download?.torrent?.done || (!media.download?.torrent && media.download?.remoteLocation)
      ? t`Play`
      : t`Streaming`;

  if (iconOnly) {
    const iconButton = (
      <Button
        tv={tv}
        size="sm"
        icon={PlayIcon}
        className={cn("shrink-0", className)}
        onClick={handlePlay}
        onMouseEnter={preloadMoviPlayer}
        onFocus={preloadMoviPlayer}
        onPointerDown={preloadMoviPlayer}
        aria-label={playActionLabel}
        {...props}
      />
    );

    if (tvMode) {
      return iconButton;
    }

    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
          <TooltipContent side="top" className="text-xs font-medium">
            {remainingTime ? `${playActionLabel} · ${remainingTime}` : playActionLabel}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const playButton = (
    <Button
      tv={tv}
      size="sm"
      className={cn(
        "relative shrink-0 w-auto max-w-full overflow-hidden",
        showWatchProgress && "bg-primary/40 hover:bg-primary/60",
        className,
      )}
      onClick={handlePlay}
      onMouseEnter={preloadMoviPlayer}
      onFocus={preloadMoviPlayer}
      onPointerDown={preloadMoviPlayer}
      {...props}
    >
      {showWatchProgress && (
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 pointer-events-none rounded-md"
          style={{ width: `${watchProgressPercent}%` }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center">
        <PlayIcon className="size-3.5 mr-1" />
        {showWatchProgress ? (
          <Trans>Resume</Trans>
        ) : media.download?.torrent?.done || (!media.download?.torrent && media.download?.remoteLocation) ? (
          <Trans>Play</Trans>
        ) : (
          <Trans>Streaming</Trans>
        )}
      </span>
    </Button>
  );

  if (tvMode) {
    return playButton;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{playButton}</TooltipTrigger>

        {remainingTime && (
          <TooltipContent side="top" className="text-xs font-medium">
            {remainingTime}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
