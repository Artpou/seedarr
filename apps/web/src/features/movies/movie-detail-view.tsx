import { useMemo } from "react";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";

import { useRole } from "@/features/auth/hooks/use-role";
import { downloadQueries } from "@/features/downloads/hooks/download.queries";
import { MediaCarouselCast } from "@/features/media/components/carousel/media-carousel-cast";
import { type MediaDetailTab, MediaDetailView } from "@/features/media/media-detail-view";
import { MovieRelated } from "@/features/movies/components/movie-related";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { tvDetailInitialFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";

export interface MovieDetailViewProps {
  movieId: string;
  urlTab?: MediaDetailTab;
}

export function MovieDetailView({ movieId, urlTab }: MovieDetailViewProps) {
  const { role } = useRole();
  const tvMode = useTvMode();
  const navigate = useNavigate();
  const locale = useTmdbLocale();
  const { data } = useSuspenseQuery(movieQueries.details(movieId, locale));
  const { media } = data;

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
    if (hasActiveDownload) return "downloads";
    if (remoteDownloads.length > 0) return "server";
    return "info";
  }, [urlTab, torrentDownloads.length, remoteDownloads.length, hasActiveDownload]);

  useTvInitialFocus(
    tvDetailInitialFocusKey({
      mediaType: "movie",
      mediaId: movieId,
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
      {tvMode ? (
        <>
          <MovieRelated
            collection={data.collection}
            collectionMedia={data.related.collection}
            recommendedMovies={data.related.recommendations}
          />
          <MediaCarouselCast data={data} />
        </>
      ) : (
        <>
          <MediaCarouselCast data={data} />
          <MovieRelated
            collection={data.collection}
            collectionMedia={data.related.collection}
            recommendedMovies={data.related.recommendations}
          />
        </>
      )}
    </MediaDetailView>
  );
}
