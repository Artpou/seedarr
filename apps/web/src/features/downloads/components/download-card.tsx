import { Link, useNavigate } from "@tanstack/react-router";
import { Info, Loader2, Pause, Play } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

import { MediaCard } from "@/features/media/components/media-card";
import { useMedia } from "@/features/media/hooks/use-media";
import {
  type TorrentDownload,
  usePauseTorrent,
  useResumeTorrent,
} from "@/features/torrent/hooks/use-torrent-download";
import { DownloadMetadata } from "./download-metadata";
import { DownloadProgressBar } from "./download-progress-bar";
import { DownloadStatusBadge } from "./download-status-badge";

interface DownloadCardProps {
  torrent: TorrentDownload;
  inGrid?: boolean;
}

export function DownloadCard({ torrent, inGrid = false }: DownloadCardProps) {
  const { data: media } = useMedia(torrent.mediaId ?? 0);
  const navigate = useNavigate();

  const progress = torrent.live ? torrent.live.progress : torrent.status === "completed" ? 1 : 0;
  const downloadSpeed = torrent.live?.downloadSpeed ?? 0;
  const uploadSpeed = torrent.live?.uploadSpeed ?? 0;
  const numPeers = torrent.live?.numPeers ?? 0;
  const pauseTorrent = usePauseTorrent();
  const resumeTorrent = useResumeTorrent();

  const handlePauseResume = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (torrent.status === "paused") {
      resumeTorrent.mutate(torrent.id);
    } else if (torrent.status === "downloading" || torrent.status === "queued") {
      pauseTorrent.mutate(torrent.id);
    }
  };

  if (!media) return null;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate({ to: "/downloads/$downloadId/play", params: { downloadId: torrent.id } });
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const mediaPath = media.type === "movie" ? `/movies/${media.id}` : `/tv/${media.id}`;
    window.location.href = mediaPath;
  };

  // Grid layout variant
  if (inGrid) {
    const isDownloading = torrent.status === "downloading" || torrent.status === "queued";

    return (
      <Link to="/downloads/$downloadId" params={{ downloadId: torrent.id }}>
        <div className="relative group">
          <MediaCard media={media} hideInfo className="pointer-events-none" />

          {/* Loading indicator - top */}
          {isDownloading && (
            <div className="absolute top-0 left-0 right-0 h-3 bg-muted overflow-hidden rounded-t-xl">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* Quality and Language badges - top left (only for completed) */}
          {!isDownloading && (torrent.quality || torrent.language) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {torrent.quality && (
                <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                  {torrent.quality}
                </Badge>
              )}
              {torrent.language && (
                <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                  {torrent.language}
                </Badge>
              )}
            </div>
          )}

          {/* Info button - top right */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleInfo}
          >
            <Info className="size-4" />
          </Button>

          {/* Play button - bottom */}
          <div className="absolute bottom-2 left-2 right-2">
            <Button onClick={handlePlay} className="w-full" disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Downloading
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Play
                </>
              )}
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  // Original list layout
  return (
    <Link to="/downloads/$downloadId" params={{ downloadId: torrent.id }}>
      <Card className="flex-row hover:bg-accent/50 cursor-pointer gap-3 mt-3">
        {/* Poster Image */}
        <div className="w-[100px] shrink-0 relative ml-3">
          <div className="w-full h-full">
            <MediaCard media={media} />
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            <div className="flex items-start gap-4">
              <div className="flex flex-col">
                <Link to="/movies/$movieId" params={{ movieId: media.id.toString() }}>
                  <h3 className="text-lg font-semibold line-clamp-2 flex-1">{media.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-3">{media.overview}</p>
              </div>

              <DownloadStatusBadge status={torrent.status} />
            </div>

            {/* Metadata */}
            <DownloadMetadata
              origin={torrent.origin}
              quality={torrent.quality}
              language={torrent.language}
            />
          </div>

          {/* Progress Bar */}
          <div className="flex w-full gap-3 items-end">
            <DownloadProgressBar
              progress={progress}
              downloadSpeed={downloadSpeed}
              uploadSpeed={uploadSpeed}
              numPeers={numPeers}
              className="my-3"
            />

            {(torrent.status === "downloading" ||
              torrent.status === "queued" ||
              torrent.status === "paused") && (
              <Button
                variant="outline"
                size="icon"
                onClick={handlePauseResume}
                disabled={pauseTorrent.isPending || resumeTorrent.isPending}
              >
                {torrent.status === "paused" ? (
                  <Play className="size-4" />
                ) : (
                  <Pause className="size-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
