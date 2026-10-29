import { useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { Download, Media, TMDBTvDetails } from "@seedarr/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDownIcon, ChevronUpIcon, ClapperboardIcon, MagnetIcon } from "lucide-react";

import { DialogDelete } from "@/shared/components/dialog/dialog-delete";
import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { useRole } from "@/features/auth/hooks/use-role";
import { getDownloadStatus } from "@/features/downloads/helpers/downloads.helper";
import { useDownloadDelete } from "@/features/downloads/hooks/download.queries";
import { MediaBadgeDate } from "@/features/media/components/badge/media-badge-date";
import { MediaBadgeRuntime } from "@/features/media/components/badge/media-badge-runtime";
import { MediaButtonPlay } from "@/features/media/components/button/media-button-play";
import { getBackdropUrl } from "@/features/media/helpers/media.helper";
import { TvEpisodeDownloadControls } from "@/features/tv/components/tv-episode-download-controls";
import { TvEpisodeDownloadPanel } from "@/features/tv/components/tv-episode-download-panel";
import { formatSeasonEpisode } from "@/features/tv/helpers/episode.helper";
import {
  getEpisodesCoveredByDownload,
  isEpisodeWantedByDownload,
} from "@/features/tv/helpers/episode-downloads.helper";
import { tvQueries } from "@/features/tv/hooks/tv.queries";
import { useEpisodeDownloadMap } from "@/features/tv/hooks/use-episode-download-map";
import { tvEpisodeRowFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

function countSeasonDownloads(
  seasonNumber: number,
  episodeCount: number,
  episodeDownloadMap: Map<string, Download>,
): number {
  let downloaded = 0;
  for (let episode = 1; episode <= episodeCount; episode++) {
    if (episodeDownloadMap.has(`${seasonNumber}-${episode}`)) downloaded++;
  }
  return downloaded;
}

interface TvEpisodesSectionProps {
  tv: TMDBTvDetails;
  media?: Media;
  downloads: Download[];
}

export function TvEpisodesSection({ tv, media, downloads }: TvEpisodesSectionProps) {
  const { role } = useRole();
  const { t } = useLingui();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const tvMode = useTvMode();
  const locale = useTmdbLocale();
  const deleteTorrent = useDownloadDelete();
  const validSeasons = useMemo(() => (tv.seasons ?? []).filter((s) => s.season_number > 0), [tv.seasons]);

  const [selectedSeason, setSelectedSeason] = useState<string>(() => validSeasons[0]?.season_number?.toString() ?? "1");
  const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    downloadId: string;
    episodes: { season: number; episode: number; name?: string }[];
  } | null>(null);

  const seasonNumber = Number(selectedSeason);

  const { data: seasonDetails, isLoading } = useQuery({
    ...tvQueries.season(tv.id, seasonNumber, locale),
    enabled: validSeasons.length > 0,
  });

  const episodeDownloadMap = useEpisodeDownloadMap(downloads);

  const episodeNameByKey = useMemo(() => {
    const names = new Map<string, string>();
    for (const episode of seasonDetails?.episodes ?? []) {
      names.set(`${seasonNumber}-${episode.episode_number}`, episode.name);
    }
    return names;
  }, [seasonDetails?.episodes, seasonNumber]);

  if (validSeasons.length === 0) return null;

  const episodes = (seasonDetails?.episodes ?? []).slice().sort((a, b) => a.episode_number - b.episode_number);
  const firstEpisodeFocusKey =
    tvMode && episodes[0] ? tvEpisodeRowFocusKey(tv.id, seasonNumber, episodes[0].episode_number) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ResponsiveTabs
          value={selectedSeason}
          onValueChange={setSelectedSeason}
          className="min-w-0 flex-1"
          tvFocusKeyPrefix={tvMode ? `TV-SEASON-${tv.id}` : undefined}
          tvGetDownFocusKey={tvMode ? () => firstEpisodeFocusKey : undefined}
          options={validSeasons.map((season) => {
            const episodeCount = season.episode_count ?? 0;
            const downloaded = countSeasonDownloads(season.season_number, episodeCount, episodeDownloadMap);

            return {
              value: season.season_number.toString(),
              label: (
                <span className="flex items-center gap-2">
                  <Trans>Season {season.season_number}</Trans>
                  {downloaded > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {downloaded}/{episodeCount}
                    </Badge>
                  )}
                </span>
              ),
            };
          })}
        />
        {!tvMode ? (
          <Button size={isMobile ? "icon-lg" : "default"} asChild icon={MagnetIcon}>
            <Link to="/tv/$id/torrents" params={{ id: tv.id.toString() }} search={{ season: seasonNumber }}>
              {!isMobile && <Trans>Torrents</Trans>}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`ep-skel-${i.toString()}`} className="h-32 w-full rounded-lg" />
          ))
        ) : episodes.length === 0 ? (
          <Card className="p-6 text-center text-popover-foreground">
            <Trans>No episodes available</Trans>
          </Card>
        ) : (
          episodes.map((episode) => {
            const episodeDownload = episodeDownloadMap.get(`${seasonNumber}-${episode.episode_number}`);
            const episodeDownloadId = episodeDownload?.id;
            const episodeStatus = episodeDownload ? getDownloadStatus(episodeDownload) : null;
            const episodeWanted = episodeDownload
              ? isEpisodeWantedByDownload(episodeDownload, seasonNumber, episode.episode_number)
              : false;
            const isDownloaded = episodeWanted && episodeStatus === "completed";
            const isDownloading =
              episodeWanted &&
              (episodeStatus === "downloading" || episodeStatus === "queued" || episodeStatus === "paused");
            const hasDownload = !!episodeDownloadId && episodeWanted;
            const canPlay = Boolean(episodeDownload);

            const isProgressCompleted =
              !!media?.progress?.duration && media.progress.position >= media.progress.duration * 0.95;
            const _hasStarted =
              media?.progress &&
              media.progress.position > 0 &&
              !isProgressCompleted &&
              media.progress.downloadId === episodeDownloadId;

            const seCode = formatSeasonEpisode(seasonNumber, episode.episode_number);
            const _coveredEpisodes = episodeDownloadId
              ? getEpisodesCoveredByDownload(episodeDownloadId, episodeDownloadMap).map((covered) => ({
                  ...covered,
                  name: episodeNameByKey.get(`${covered.season}-${covered.episode}`),
                }))
              : [];

            const episodeKey = `${seasonNumber}-${episode.episode_number}`;
            const isExpanded = expandedEpisode === episodeKey;
            const toggleExpand = () => setExpandedEpisode(isExpanded ? null : episodeKey);

            const goEpisodePlay = (): void => {
              if (!episodeDownload) return;
              void navigate({
                to: "/downloads/$id/play",
                params: { id: episodeDownload.id },
                search: { season: seasonNumber, episode: episode.episode_number },
              });
            };

            const goEpisodeTorrents = (): void => {
              void navigate({
                to: "/tv/$id/torrents",
                params: { id: tv.id.toString() },
                search: { season: seasonNumber, episode: episode.episode_number },
              });
            };

            const handleEpisodePress = (): void => {
              if (canPlay && episodeDownload) {
                goEpisodePlay();
                return;
              }
              if (role !== "viewer" && !hasDownload) {
                goEpisodeTorrents();
                return;
              }
              if (hasDownload) {
                toggleExpand();
              }
            };

            const episodeLabel = `${seCode} ${episode.name}`;
            const episodeFocusKey = tvEpisodeRowFocusKey(tv.id, seasonNumber, episode.episode_number);

            const episodeCard = (
              <Card className="flex flex-col gap-4 overflow-hidden p-3 sm:flex-row">
                <div className="flex w-full flex-col items-center gap-2 sm:w-48">
                  {episode.still_path ? (
                    <div className="w-full">
                      <div className="group/poster relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={getBackdropUrl(episode.still_path, "w300")}
                          alt={episode.name}
                          className="size-full object-cover"
                        />
                        {media && canPlay && episodeDownload && (
                          <MediaButtonPlay
                            className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/poster:bg-black/50"
                            media={media}
                            downloadId={episodeDownload.id}
                            season={seasonNumber}
                            episode={episode.episode_number}
                            circular
                            spatialNav={!tvMode}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted">
                      <ClapperboardIcon className="size-10 text-muted-foreground" />
                    </div>
                  )}

                  {media && episodeDownload && (isDownloaded || isDownloading || canPlay) && (
                    <MediaButtonPlay
                      media={media}
                      downloadId={episodeDownload.id}
                      season={seasonNumber}
                      episode={episode.episode_number}
                      className="w-full"
                      spatialNav={!tvMode}
                    />
                  )}

                  {role !== "viewer" && !hasDownload && !tvMode && (
                    <Button size="sm" className="w-full" asChild icon={MagnetIcon}>
                      <Link
                        to="/tv/$id/torrents"
                        params={{ id: tv.id.toString() }}
                        search={{
                          season: seasonNumber,
                          episode: episode.episode_number,
                        }}
                      >
                        <Trans>Torrents</Trans>
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">
                        <span className="mr-2 text-muted-foreground">{seCode}</span>
                        {episode.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <MediaBadgeDate date={episode.air_date} />
                        <MediaBadgeRuntime minutes={episode.runtime} />
                      </div>
                    </div>
                    {hasDownload && !tvMode && (
                      <Button size="icon-sm" variant="ghost" onClick={toggleExpand} aria-label={t`Toggle details`}>
                        {isExpanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                      </Button>
                    )}
                  </div>
                  {episode.overview && (
                    <p className="line-clamp-3 text-sm text-popover-foreground">{episode.overview}</p>
                  )}

                  {role !== "viewer" && episodeDownload && !isExpanded && !tvMode && (
                    <TvEpisodeDownloadControls download={episodeDownload} />
                  )}
                </div>
              </Card>
            );

            return (
              <div key={episode.id} className="space-y-0">
                {tvMode ? (
                  <TvFocusable
                    focusRoot
                    className="rounded-xl"
                    tv={{ focusKey: episodeFocusKey, onPress: handleEpisodePress, accessibilityLabel: episodeLabel }}
                  >
                    {episodeCard}
                  </TvFocusable>
                ) : (
                  episodeCard
                )}

                {isExpanded && episodeDownload && (
                  <div className="mt-2">
                    <TvEpisodeDownloadPanel download={episodeDownload} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <DialogDelete
        open={Boolean(deleteTarget)}
        setOpen={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        disabled={deleteTorrent.isPending}
        title={
          (deleteTarget?.episodes.length ?? 0) > 1 ? (
            <Trans>Delete multiple episodes</Trans>
          ) : (
            <Trans>Delete download</Trans>
          )
        }
        description={
          (deleteTarget?.episodes.length ?? 0) > 1 ? (
            <div className="space-y-3">
              <p>
                <Trans>
                  This download contains a full season pack. Deleting it will remove all of the following episodes:
                </Trans>
              </p>
              <ul className="max-h-48 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                {(deleteTarget?.episodes ?? []).map((episode) => {
                  const code = formatSeasonEpisode(episode.season, episode.episode);
                  return (
                    <li key={`${episode.season}-${episode.episode}`} className="text-foreground">
                      <span className="text-muted-foreground mr-2">{code}</span>
                      {episode.name ?? null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <Trans>Are you sure you want to delete this download? This action cannot be undone.</Trans>
          )
        }
        validate={() => {
          if (!deleteTarget) return;
          deleteTorrent.mutate(
            { id: deleteTarget.downloadId },
            {
              onSuccess: () => setDeleteTarget(null),
            },
          );
        }}
      />
    </div>
  );
}
