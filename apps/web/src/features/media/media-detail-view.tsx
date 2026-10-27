import { type ReactNode, useMemo } from "react";

import { Trans } from "@lingui/react/macro";
import type { Download, Movie, TV } from "@seedarr/sdk";
import { DownloadIcon, ServerIcon, TvIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTheme } from "@/shared/hooks/use-theme";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { TvModeHide } from "@/shared/ui/tv/tv-mode-hide";

import { MediaDetails } from "@/features/media/components/media-details";
import { MediaDownload } from "@/features/media/components/media-download";
import { MediaPoster } from "@/features/media/components/media-poster";
import { MediaServer } from "@/features/media/components/media-server";
import { MediaSocialActions } from "@/features/media/components/media-social-actions";
import { MediaSheetInfo } from "@/features/media/components/sheet/media-sheet-info";
import { getBackdropUrl, getPosterUrl } from "@/features/media/helpers/media.helper";
import { tvMediaDetailTabFocusPrefix } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

export type MediaDetailTab = "info" | "downloads" | "server";

interface MediaDetailViewProps {
  data: Movie | TV;
  download?: Download | null;
  torrentDownloads?: Download[];
  remoteDownloads?: Download[];
  tab: MediaDetailTab;
  onTabChange: (tab: MediaDetailTab) => void;
  /** Type-specific content under MediaInfo (episodes, related…). */
  children?: ReactNode;
}

export function MediaDetailView({
  data,
  download,
  torrentDownloads = [],
  remoteDownloads = [],
  tab,
  onTabChange,
  children,
}: MediaDetailViewProps) {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const tvMode = useTvMode();

  const media = data.media;
  const isMovie = "movie" in data;
  const item = isMovie ? data.movie : data.tv;
  const backdropPath = item.backdrop_path;
  const posterPath = item.poster_path;
  const mediaType = isMovie ? "movie" : "tv";
  const title =
    ("title" in item && item.title) ||
    ("name" in item && item.name) ||
    ("original_title" in item && item.original_title) ||
    ("original_name" in item && item.original_name) ||
    "";

  const showDownloads = torrentDownloads.length > 0;
  const showServer = remoteDownloads.length > 0;
  const showTabs = showDownloads || showServer;

  const tabOptions = useMemo(
    () => [
      { value: "info", label: <Trans>Info</Trans>, icon: TvIcon },
      ...(showDownloads
        ? [
            {
              value: "downloads",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Trans>Downloads</Trans>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {torrentDownloads.length}
                  </Badge>
                </span>
              ),
              icon: DownloadIcon,
            },
          ]
        : []),
      ...(showServer
        ? [
            {
              value: "server",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Trans>Server</Trans>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {remoteDownloads.length}
                  </Badge>
                </span>
              ),
              icon: ServerIcon,
            },
          ]
        : []),
    ],
    [showDownloads, showServer, torrentDownloads.length, remoteDownloads.length],
  );

  const detailTabFocusPrefix = media ? tvMediaDetailTabFocusPrefix(mediaType, media.id) : undefined;

  const tabsControl = showTabs ? (
    <ResponsiveTabs
      value={tab}
      onValueChange={(v) => onTabChange(v as MediaDetailTab)}
      options={tabOptions}
      tvFocusKeyPrefix={tvMode ? detailTabFocusPrefix : undefined}
    />
  ) : null;

  return (
    <div>
      <div className="relative w-full py-0 sm:py-6">
        {!isMobile && (
          <div
            className={cn("absolute inset-0 -z-10 w-full bg-cover bg-center filter", tvMode ? "h-[40vh]" : "h-[50vh]")}
            style={{
              backgroundImage: `url(${getBackdropUrl(backdropPath) || getPosterUrl(posterPath)})`,
            }}
          >
            <div
              className={cn(
                "absolute inset-0 bg-linear-to-b from-background to-background",
                tvMode ? "via-background/90" : theme === "dark" ? "via-background/85" : "via-background/70",
              )}
            />
          </div>
        )}

        <Container className="relative flex flex-col gap-6">
          {tabOptions.length > 1 && !tvMode && <div className="lg:hidden">{tabsControl}</div>}

          <div
            className={cn(
              "grid grid-cols-1 items-start gap-6 sm:gap-8",
              tvMode ? "md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-10" : "lg:grid-cols-4 xl:grid-cols-5",
            )}
          >
            <aside className={cn(!tvMode && "lg:col-span-1", tvMode && "md:sticky md:top-20 md:self-start")}>
              <MediaPoster data={data} download={download ?? media?.download} />
              {tvMode && media && <MediaSocialActions media={media} className="mt-4 justify-center" size="lg" />}
            </aside>

            <div className={cn("flex min-w-0", !tvMode && "lg:col-span-3 xl:col-span-4")}>
              <div className="flex w-full min-w-0 flex-col gap-4">
                {tabsControl && !tvMode && <div className="hidden lg:block">{tabsControl}</div>}
                {tabsControl && tvMode && tabOptions.length > 1 && <div>{tabsControl}</div>}
                {media && !isMobile && (
                  <TvModeHide>
                    <div className="flex xl:hidden ">
                      <MediaSocialActions media={media} />
                    </div>
                  </TvModeHide>
                )}
                {(!showTabs || tab === "info") && (
                  <div className="flex flex-col gap-6">
                    <div className="flex">
                      <MediaSheetInfo data={data}>
                        <TvModeHide>{isMobile && <MediaSocialActions media={media} />}</TvModeHide>
                      </MediaSheetInfo>
                      <aside className="hidden xl:flex flex-col gap-6 min-w-56 ml-6">
                        <TvModeHide>{media && <MediaSocialActions media={media} />}</TvModeHide>
                        <div>
                          <p className="sr-only">{title}</p>
                          <MediaDetails data={data} />
                        </div>
                      </aside>
                    </div>
                    {children}
                  </div>
                )}
                {showTabs &&
                  tab === "downloads" &&
                  showDownloads &&
                  (isMobile ? (
                    <MediaDownload downloads={torrentDownloads} mediaType={mediaType} />
                  ) : (
                    <Card className="p-4">
                      <MediaDownload downloads={torrentDownloads} mediaType={mediaType} />
                    </Card>
                  ))}
                {showTabs && tab === "server" && showServer && (
                  <Card className="p-4 w-full">
                    <MediaServer downloads={remoteDownloads} mediaType={mediaType} />
                  </Card>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
