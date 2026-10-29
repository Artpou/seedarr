import { useCallback, useMemo, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { DownloadTorrentInput, Resolution } from "@seedarr/contracts";
import type { Media, Torrent } from "@seedarr/sdk";
import { ApiError } from "@seedarr/sdk";
import { formatError, getVideoContainer, parseInfoHashFromMagnet } from "@seedarr/shared";
import { Link, useNavigate } from "@tanstack/react-router";
import { type SortingState, useTable } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon, InfoIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/shared/components/empty-state";
import { Flag } from "@/shared/components/flag";
import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { SeedarrLoader } from "@/shared/components/seedarr-loader";
import { SelectLang } from "@/shared/components/select/select-lang";
import { QUALITY_LEVELS, SelectQuality } from "@/shared/components/select/select-quality";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { useStartDownload } from "@/features/downloads/hooks/download.queries";
import { useUserPreferences } from "@/features/settings/stores/user-preference-store";
import { indexerModuleImages } from "@/features/torrent/helpers/indexer-images";
import {
  collectTorrentLanguages,
  torrentLanguageTags,
  torrentMatchesLanguageFilter,
  torrentMatchesQualityFilter,
} from "@/features/torrent/helpers/torrent-filter.helper";
import { getTorrentInfoHash, getTorrentUri } from "@/features/torrent/helpers/torrent-uri.helper";
import {
  type TorrentWithMeta,
  torrentTableFeatures,
  useTorrentColumns,
} from "@/features/torrent/hooks/use-torrent-columns";
import {
  tvTorrentLangFilterFocusPrefix,
  tvTorrentQualityFilterFocusPrefix,
  tvTorrentRowFocusKey,
} from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";
import { TorrentInspectModal } from "./torrent-inspect-modal";
import { TorrentUnavailableDialog } from "./torrent-unavailable-dialog";

interface TorrentTableProps {
  torrents: TorrentWithMeta[];
  media: Media;
  isLoading?: boolean;
  hasIndexers?: boolean;
  season?: number;
  episode?: number;
  fullSeason?: boolean;
  existingInfoHashes?: ReadonlySet<string>;
}

function TorrentEmptyState({ hasIndexers }: { hasIndexers: boolean }) {
  if (!hasIndexers) {
    return (
      <EmptyState
        title={<Trans>No indexers configured</Trans>}
        subtitle={<Trans>Install and enable an indexer module to search torrents.</Trans>}
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/settings/modules" search={{ tab: "indexer" }}>
              <Trans>Configure indexers</Trans>
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState title={<Trans>No torrents found</Trans>} subtitle={<Trans>Try adjusting your search query</Trans>} />
  );
}

function torrentRowId(torrent: TorrentWithMeta): string {
  return torrent.guid || torrent.link || torrent.title;
}

function TorrentMobileCard({
  torrent,
  media,
  onInspect,
  onDownload,
  tvMode,
}: {
  torrent: TorrentWithMeta;
  media: Media;
  onInspect: (torrent: TorrentWithMeta) => void;
  onDownload: (torrent: TorrentWithMeta) => void;
  tvMode?: boolean;
}) {
  const container = getVideoContainer(torrent.title);

  const body = (
    <Card className="gap-3 p-3 py-3">
      <div className="flex justify-between items-center">
        <span className="font-bold text-muted-foreground">{(torrent.size / 1e9).toFixed(2)} GB</span>
        <div className="flex items-center gap-1 font-bold text-success">
          <ArrowUpIcon />
          <span>{torrent.seeders}</span>
        </div>
        {torrent.indexerType !== "stremio" && (
          <div className="flex items-center gap-1 font-bold text-destructive">
            <ArrowDownIcon />
            <span>{torrent.peers}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {torrentLanguageTags(torrent, media.original_language ?? undefined).map((lang) => (
          <Flag key={lang} lang={lang} />
        ))}
        {torrent.mediaInfos?.resolution && <Badge variant="secondary">{torrent.mediaInfos.resolution}</Badge>}
        {container && <Badge variant="secondary">{container}</Badge>}
        <Badge variant="outline">{torrent.tracker}</Badge>
        {torrent.indexerType && (
          <img src={indexerModuleImages[torrent.indexerType]} alt={torrent.indexerType} className="size-4" />
        )}
        {torrent.indexerType !== "stremio" && (
          <div className="flex items-center gap-1 font-bold text-destructive">
            <ArrowDownIcon className="size-3" />
            <span className="text-xs">{torrent.peers}</span>
          </div>
        )}
      </div>

      {!tvMode && (
        <div className="flex w-full gap-2 mt-2">
          <Button
            variant="secondary"
            size="default"
            className="flex-1"
            icon={InfoIcon}
            onClick={() => onInspect(torrent)}
          >
            <Trans>Info</Trans>
          </Button>
          <Button size="default" className="flex-1" icon={DownloadIcon} onClick={() => onDownload(torrent)}>
            <Trans>Download</Trans>
          </Button>
        </div>
      )}
    </Card>
  );

  if (!tvMode) return body;

  return (
    <TvFocusable
      focusRoot
      className="rounded-xl"
      tv={{
        focusKey: tvTorrentRowFocusKey(media.id, torrentRowId(torrent)),
        onPress: () => onDownload(torrent),
        accessibilityLabel: torrent.title,
      }}
    >
      {body}
    </TvFocusable>
  );
}

export function TorrentTable({
  torrents,
  media,
  isLoading = false,
  hasIndexers = true,
  season,
  episode,
  fullSeason,
  existingInfoHashes,
}: TorrentTableProps) {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const tvMode = useTvMode();
  const startDownload = useStartDownload();
  const navigate = useNavigate();
  const preferenceQuality = useUserPreferences((s) => s.quality);
  const preferenceMaxSize = useUserPreferences((s) => s.maxSize);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedQuality, setSelectedQuality] = useState<Resolution | null>(preferenceQuality);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [selectedMagnetUri, setSelectedMagnetUri] = useState<string | null>(null);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);
  const [pendingDownloadInput, setPendingDownloadInput] = useState<DownloadTorrentInput | null>(null);
  const [unavailableAction, setUnavailableAction] = useState<"retry" | "local" | null>(null);

  const filteredTorrents = useMemo(() => {
    const maxSizeBytes = preferenceMaxSize !== null ? preferenceMaxSize * 1024 * 1024 * 1024 : null;

    return torrents.filter((torrent) => {
      if (!torrentMatchesQualityFilter(torrent.mediaInfos?.resolution, selectedQuality)) {
        return false;
      }

      if (maxSizeBytes !== null && torrent.size > maxSizeBytes) {
        return false;
      }

      if (!torrentMatchesLanguageFilter(torrent.mediaInfos?.languages, selectedLanguage)) {
        return false;
      }

      return true;
    });
  }, [torrents, selectedQuality, selectedLanguage, preferenceMaxSize]);

  const availableLanguages = useMemo(() => collectTorrentLanguages(torrents), [torrents]);

  const languageTabOptions = useMemo(
    () => [
      { value: "all", label: <Trans>All languages</Trans> },
      ...availableLanguages.map((lang) => ({
        value: lang,
        label: (
          <span className="flex items-center gap-2">
            <Flag lang={lang} />
            {lang.toUpperCase()}
          </span>
        ),
      })),
    ],
    [availableLanguages],
  );

  const qualityTabOptions = useMemo(
    () =>
      QUALITY_LEVELS.map((level) => ({
        value: level ?? "all",
        label: !level ? <Trans>All qualities</Trans> : level,
      })),
    [],
  );

  const handleOpenInspectModal = useCallback((torrent: TorrentWithMeta) => {
    setSelectedTorrent(torrent);
    setSelectedMagnetUri(getTorrentUri(torrent));
    setModalOpen(true);
  }, []);

  const executeDownload = useCallback(
    async (input: DownloadTorrentInput, toastId?: string | number) => {
      const hash = parseInfoHashFromMagnet(input.magnetUri)?.toLowerCase();
      const willReuse = hash ? existingInfoHashes?.has(hash) : false;
      const id =
        toastId ?? toast.loading(willReuse ? t`Adding episode…` : t`Starting download…`, { description: input.name });

      try {
        await startDownload.mutateAsync(input);
        toast.info(willReuse ? t`Using existing download` : t`Download started`, {
          id,
          description: input.name,
        });
        navigate({
          to: media.type === "tv" ? "/tv/$id" : "/movies/$id",
          params: { id: String(media.id) },
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast.dismiss(id);
          setPendingDownloadInput(input);
          setUnavailableDialogOpen(true);
          return;
        }
        const message = formatError(error) || t`Unknown error`;
        toast.error(t`Download failed`, { id, description: message });
      }
    },
    [startDownload, navigate, t, media.id, media.type, existingInfoHashes],
  );

  const handleAddDownload = useCallback(
    async (torrent: TorrentWithMeta) => {
      if (media.type === "tv") {
        if (season === undefined) {
          toast.error(t`Select a season first.`);
          return;
        }
        if (episode === undefined && !fullSeason) {
          toast.error(t`Pick an episode to download, or choose "All episodes (full season)".`);
          return;
        }
      }

      await executeDownload({
        magnetUri: getTorrentUri(torrent),
        name: torrent.title,
        media,
        origin: torrent.tracker,
        quality: torrent.mediaInfos?.resolution,
        language: torrent.mediaInfos?.languages?.[0],
        container: getVideoContainer(torrent.title) ?? undefined,
        moduleIndexerId: torrent.moduleId,
        ...(media.type === "tv" && season !== undefined
          ? {
              season,
              ...(episode !== undefined ? { episode } : { fullSeason: true }),
            }
          : {}),
      });
    },
    [executeDownload, media, season, episode, fullSeason, t],
  );

  const isTorrentInLibrary = useCallback(
    (torrent: TorrentWithMeta): boolean => {
      const hash = getTorrentInfoHash(torrent);
      if (!hash || !existingInfoHashes) return false;
      return existingInfoHashes.has(hash);
    },
    [existingInfoHashes],
  );

  const handleUnavailableRetry = async () => {
    if (!pendingDownloadInput) return;
    setUnavailableAction("retry");
    await executeDownload(pendingDownloadInput);
    setUnavailableAction(null);
    setUnavailableDialogOpen(false);
    setPendingDownloadInput(null);
  };

  const handleUnavailableLocal = async () => {
    if (!pendingDownloadInput) return;
    setUnavailableAction("local");
    await executeDownload({ ...pendingDownloadInput, preferLocal: true });
    setUnavailableAction(null);
    setUnavailableDialogOpen(false);
    setPendingDownloadInput(null);
  };

  const handleUnavailableCancel = () => {
    setUnavailableDialogOpen(false);
    setPendingDownloadInput(null);
    setUnavailableAction(null);
  };

  const columns = useTorrentColumns({
    media,
    count: filteredTorrents.length,
    onInspect: handleOpenInspectModal,
    onDownload: handleAddDownload,
    isInLibrary: isTorrentInLibrary,
    tvMode,
  });

  const table = useTable({
    features: torrentTableFeatures,
    data: filteredTorrents,
    columns,
    getRowId: (row) => row.guid || row.link || row.title,
    onSortingChange: setSorting,
    state: { sorting },
  });

  const showLoader = isLoading && filteredTorrents.length === 0;

  const firstTorrentRowFocusKey = useMemo(() => {
    const first = filteredTorrents[0];
    if (!first || showLoader) return undefined;
    return tvTorrentRowFocusKey(media.id, torrentRowId(first));
  }, [filteredTorrents, showLoader, media.id]);

  useTvInitialFocus(tvMode ? firstTorrentRowFocusKey : undefined);

  const tvRow = useMemo(
    () =>
      tvMode
        ? {
            getFocusKey: (row: { id: string }) => tvTorrentRowFocusKey(media.id, row.id),
            onPress: (row: { original: TorrentWithMeta }) => handleAddDownload(row.original),
            getAccessibilityLabel: (row: { original: TorrentWithMeta }) => row.original.title,
          }
        : undefined,
    [tvMode, media.id, handleAddDownload],
  );

  return (
    <div className="w-full overflow-hidden">
      <div
        className={
          tvMode
            ? "flex flex-col gap-3 py-4"
            : "flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
        }
      >
        {tvMode ? (
          <>
            {availableLanguages.length > 0 && (
              <ResponsiveTabs
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                options={languageTabOptions}
                tvFocusKeyPrefix={tvTorrentLangFilterFocusPrefix}
              />
            )}
            {availableLanguages.length > 0 && <div className="h-px w-full shrink-0 bg-border/70" aria-hidden />}
            <ResponsiveTabs
              value={selectedQuality ?? "all"}
              onValueChange={(next) => setSelectedQuality(next === "all" ? null : (next as Resolution))}
              options={qualityTabOptions}
              tvFocusKeyPrefix={tvTorrentQualityFilterFocusPrefix}
            />
          </>
        ) : (
          <>
            {availableLanguages.length > 0 && (
              <SelectLang
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                languages={availableLanguages}
                triggerClassName="w-full sm:w-auto"
              />
            )}
            <SelectQuality
              value={selectedQuality}
              onValueChange={setSelectedQuality}
              triggerClassName="w-full sm:w-auto"
            />
          </>
        )}
        {preferenceMaxSize !== null && (
          <Badge variant="outline">
            <Trans>Max {preferenceMaxSize} GB</Trans>
          </Badge>
        )}
      </div>

      {isMobile && !tvMode ? (
        showLoader ? (
          <SeedarrLoader />
        ) : filteredTorrents.length === 0 ? (
          <TorrentEmptyState hasIndexers={hasIndexers} />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTorrents.map((torrent) => (
              <TorrentMobileCard
                key={torrent.guid || torrent.link || torrent.title}
                torrent={torrent}
                media={media}
                onInspect={handleOpenInspectModal}
                onDownload={handleAddDownload}
              />
            ))}
          </div>
        )
      ) : (
        <DataTable
          table={table}
          classNameContainer="rounded-tl-none"
          empty={showLoader ? <SeedarrLoader /> : <TorrentEmptyState hasIndexers={hasIndexers} />}
          tvRow={tvRow}
        />
      )}

      <TorrentInspectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        torrent={selectedTorrent}
        magnetUri={selectedMagnetUri}
      />

      <TorrentUnavailableDialog
        open={unavailableDialogOpen}
        onRetry={handleUnavailableRetry}
        onCancel={handleUnavailableCancel}
        onStoreLocally={handleUnavailableLocal}
        isRetrying={unavailableAction === "retry"}
        isStoringLocally={unavailableAction === "local"}
      />
    </div>
  );
}
