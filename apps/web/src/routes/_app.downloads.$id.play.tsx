import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { Plyr } from "plyr-react";
import "plyr-react/plyr.css";

import { AppBreadcrumb } from "@/shared/components/app-breadcrumb";
import { SeedarrLoader } from "@/shared/components/seedarr-loader";
import { Container } from "@/shared/ui/container";

import { useTorrentDownload } from "@/features/torrent/hooks/use-torrent-download";
import { useTorrentLink } from "@/features/torrent/hooks/use-torrent-link";

export const Route = createFileRoute("/_app/downloads/$id/play")({
  component: VideoPlayerPage,
});

function VideoPlayerPage() {
  const { id } = Route.useParams();
  const { data: torrent, isLoading } = useTorrentDownload(id);
  const videoUrl = useTorrentLink(id);

  const plyrOptions = {
    controls: [
      "play-large",
      "restart",
      "rewind",
      "play",
      "fast-forward",
      "progress",
      "current-time",
      "duration",
      "mute",
      "volume",
      "captions",
      "settings",
      "pip",
      "airplay",
      "fullscreen",
    ],
    settings: ["captions", "quality", "speed"],
  };

  if (isLoading) {
    return (
      <Container>
        <SeedarrLoader />
      </Container>
    );
  }

  if (!torrent) {
    return (
      <Container>
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            <Trans>Download not found</Trans>
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-7xl">
      <div className="space-y-4">
        <AppBreadcrumb
          items={[
            { name: "Downloads", link: "/downloads" },
            { name: torrent.name, link: `/downloads/${id}` },
            { name: "Play" },
          ]}
        />

        {/* Video Player */}
        <div
          className="w-full bg-black rounded-lg overflow-hidden"
          style={
            {
              "--plyr-color-main": "var(--primary)",
            } as React.CSSProperties
          }
        >
          <Plyr
            source={{
              type: "video",
              sources: [
                {
                  src: videoUrl,
                },
              ],
            }}
            options={plyrOptions}
          />
        </div>
      </div>
    </Container>
  );
}
