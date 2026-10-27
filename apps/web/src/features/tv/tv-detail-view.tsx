import { useMemo } from "react";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";

import { useRole } from "@/features/auth/hooks/use-role";
import { downloadQueries } from "@/features/downloads/hooks/download.queries";
import { MediaCarouselCast } from "@/features/media/components/carousel/media-carousel-cast";
import { type MediaDetailTab, MediaDetailView } from "@/features/media/media-detail-view";
import { TvEpisodesSection } from "@/features/tv/components/tv-episodes-section";
import { TvRelated } from "@/features/tv/components/tv-related";
import { tvQueries } from "@/features/tv/hooks/tv.queries";
import { tvDetailInitialFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";

export interface TvDetailViewProps {
  tvId: string;
  urlTab?: MediaDetailTab;
}

export function TvDetailView({ tvId, urlTab }: TvDetailViewProps) {
  const { role } = useRole();
  const navigate = useNavigate();
  const locale = useTmdbLocale();
  const { data } = useSuspenseQuery(tvQueries.details(tvId, locale));
  const { tv, media, related } = data;

  const { data: mediaDownloads = [] } = useQuery(downloadQueries.byMedia(media));

  const liveDownload = useMemo(() => {
    if (!media) return null;
    if (media.download?.id) {
      return mediaDownloads.find((d) => d.id === media.download?.id) ?? media.download;
    }
    return mediaDownloads[0] ?? null;
  }, [media, mediaDownloads]);

  const torrentDownloads = useMemo(() => mediaDownloads.filter((d) => d.torrent), [mediaDownloads]);
  const remoteDownloads = useMemo(() => mediaDownloads.filter((d) => d.remoteLocation), [mediaDownloads]);
  const hasActiveDownload = torrentDownloads.some((d) => d.torrent && !d.torrent.done);

  const tab = useMemo((): MediaDetailTab => {
    if (urlTab === "downloads" && torrentDownloads.length === 0) return "info";
    if (urlTab === "server" && remoteDownloads.length === 0) return "info";
    if (urlTab) return urlTab;
    return hasActiveDownload ? "downloads" : "info";
  }, [urlTab, torrentDownloads.length, remoteDownloads.length, hasActiveDownload]);

  useTvInitialFocus(
    tvDetailInitialFocusKey({
      mediaType: "tv",
      mediaId: tvId,
      downloadId: liveDownload?.id,
      isViewer: role === "viewer",
    }),
  );

  return (
    <MediaDetailView
      data={data}
      download={liveDownload}
      torrentDownloads={torrentDownloads}
      remoteDownloads={remoteDownloads}
      tab={tab}
      onTabChange={(t) => navigate({ to: ".", search: { tab: t }, replace: true })}
    >
      <TvEpisodesSection tv={tv} media={media} downloads={mediaDownloads} />
      <MediaCarouselCast data={data} />
      <TvRelated recommendedTV={related.recommendations} />
    </MediaDetailView>
  );
}
