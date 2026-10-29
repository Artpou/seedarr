import { useMemo, useState } from "react";

import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { Media, SubdlSubtitle } from "@seedarr/sdk";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, DownloadIcon, StarIcon, SubtitlesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Flag } from "@/shared/components/flag";
import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { Select } from "@/shared/components/select/select";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { getTorrentFiles } from "@/features/downloads/helpers/downloads.helper";
import type { SubtitlePlaybackScope } from "@/features/downloads/helpers/subtitle-tracks.helper";
import { downloadQueries } from "@/features/downloads/hooks/download.queries";
import { useTvBackIntercept } from "@/features/tv-mode/tv-back-intercept";
import { tvSubtitleLangFocusPrefix, tvSubtitleRowFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";
import {
  collectAddedSubtitleLanguages,
  isMatchingSubtitleRelease,
  sortSubtitlesByTitleMatch,
} from "../helpers/subtitle.helper";
import { subtitleQueries, useDownloadSubtitle } from "../hooks/subtitle.queries";

const SUBDL_LANGUAGE_CODES = ["EN", "FR", "ES", "DE", "IT", "PT", "NL", "PL", "RU", "JA", "KO"] as const;

const SUBDL_LANGUAGE_LABELS: Record<(typeof SUBDL_LANGUAGE_CODES)[number], ReturnType<typeof msg>> = {
  EN: msg`English`,
  FR: msg`French`,
  ES: msg`Spanish`,
  DE: msg`German`,
  IT: msg`Italian`,
  PT: msg`Portuguese`,
  NL: msg`Dutch`,
  PL: msg`Polish`,
  RU: msg`Russian`,
  JA: msg`Japanese`,
  KO: msg`Korean`,
};

export interface SubtitleSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: string;
  downloadId: string;
  mediaTitle: string;
  mediaType?: Media["type"];
  season?: number;
  episode?: number;
  subtitleScope?: SubtitlePlaybackScope;
}

export function SubtitleSearchDialog({
  open,
  onOpenChange,
  tmdbId,
  downloadId,
  mediaTitle,
  mediaType,
  season,
  episode,
  subtitleScope,
}: SubtitleSearchDialogProps) {
  const { t } = useLingui();
  const tvMode = useTvMode();
  const [language, setLanguage] = useState("EN");
  const langFocusPrefix = tvSubtitleLangFocusPrefix(downloadId);

  const { data, isLoading, error } = useQuery({
    ...subtitleQueries.search(tmdbId, language, mediaType === "tv" ? "tv" : undefined),
    enabled: open,
  });
  const { data: externalSubtitles } = useQuery({
    ...subtitleQueries.external(downloadId, subtitleScope),
    enabled: open,
  });
  const { data: download } = useQuery({
    ...downloadQueries.details(downloadId),
    enabled: open,
  });
  const downloadSubtitle = useDownloadSubtitle();

  const addedLanguages = useMemo(() => {
    const torrentFileNames = download ? getTorrentFiles(download).map((file) => file.name) : [];
    return collectAddedSubtitleLanguages(mediaTitle, externalSubtitles?.paths ?? [], torrentFileNames);
  }, [download, externalSubtitles?.paths, mediaTitle]);

  const subtitles = useMemo(
    () => sortSubtitlesByTitleMatch(data?.subtitles ?? [], mediaTitle),
    [data?.subtitles, mediaTitle],
  );

  const languageOptions = useMemo(
    () =>
      SUBDL_LANGUAGE_CODES.map((code) => ({
        value: code,
        label: (
          <SubtitleLanguageOptionLabel
            code={code}
            name={t(SUBDL_LANGUAGE_LABELS[code])}
            alreadyAdded={addedLanguages.has(code)}
            tvMode={tvMode}
          />
        ),
      })),
    [addedLanguages, t, tvMode],
  );

  const firstRowFocusKey = subtitles.length > 0 ? tvSubtitleRowFocusKey(downloadId, 0) : undefined;

  useTvBackIntercept(tvMode && open, () => onOpenChange(false));
  useTvInitialFocus(tvMode && open ? `${langFocusPrefix}-${language}` : undefined);

  const handleDownload = (input: {
    downloadId: string;
    url: string;
    language: string;
    mediaTitle: string;
    season?: number;
    episode?: number;
  }): void => {
    downloadSubtitle.mutate(
      {
        ...input,
        ...(season != null ? { season } : {}),
        ...(episode != null ? { episode } : {}),
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!tvMode}
        className={
          tvMode
            ? "flex max-h-[92vh] max-w-[min(96vw,56rem)] flex-col gap-6 overflow-hidden p-8"
            : "max-h-[85vh] max-w-2xl overflow-y-auto"
        }
      >
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", tvMode && "gap-3 text-2xl")}>
            <SubtitlesIcon className={tvMode ? "size-7" : "size-5"} aria-hidden />
            <Trans>Download subtitles</Trans>
          </DialogTitle>
        </DialogHeader>

        <div className={tvMode ? "flex min-h-0 flex-1 flex-col gap-5" : "space-y-4"}>
          <div className="space-y-2">
            <Label className={tvMode ? "text-base font-semibold" : undefined}>
              <Trans>Language</Trans>
            </Label>
            {tvMode ? (
              <ResponsiveTabs
                value={language}
                onValueChange={setLanguage}
                options={languageOptions}
                tvFocusKeyPrefix={langFocusPrefix}
                tvGetDownFocusKey={firstRowFocusKey && !isLoading && !error ? () => firstRowFocusKey : undefined}
              />
            ) : (
              <Select value={language} onValueChange={setLanguage} options={languageOptions} />
            )}
          </div>

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className={tvMode ? "h-14 w-full" : "h-10 w-full"} />
              <Skeleton className={tvMode ? "h-48 w-full" : "h-32 w-full"} />
            </div>
          )}

          {error && (
            <p className={tvMode ? "text-destructive text-base" : "text-destructive text-sm"}>
              <Trans>Failed to load subtitles</Trans>: {(error as Error).message}
            </p>
          )}

          {!isLoading && !error && (
            <div className={tvMode ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-2"}>
              <Label className={tvMode ? "text-base font-semibold" : undefined}>
                <Trans>Available subtitles</Trans> ({subtitles.length})
              </Label>
              <ScrollArea
                className={
                  tvMode
                    ? "min-h-[min(42vh,28rem)] w-full min-w-0 flex-1 rounded-lg border-2 border-border/80 p-3 [&_[data-slot=scroll-area-viewport]]:min-w-0"
                    : "h-[280px] w-full min-w-0 rounded-md border p-2 [&_[data-slot=scroll-area-viewport]]:min-w-0"
                }
              >
                <ul className={cn("w-full min-w-0", tvMode ? "space-y-3" : "space-y-2")}>
                  {subtitles.length === 0 ? (
                    <li
                      className={
                        tvMode
                          ? "text-muted-foreground py-8 text-center text-base"
                          : "text-muted-foreground py-4 text-center text-sm"
                      }
                    >
                      <Trans>No subtitles found for this language.</Trans>
                    </li>
                  ) : (
                    subtitles.map((sub, index) => (
                      <SubtitleRow
                        key={sub.url}
                        subtitle={sub}
                        mediaTitle={mediaTitle}
                        downloadId={downloadId}
                        language={language}
                        rowIndex={index}
                        langFocusKey={`${langFocusPrefix}-${language}`}
                        tvMode={tvMode}
                        onDownload={handleDownload}
                        isDownloading={downloadSubtitle.isPending && downloadSubtitle.variables?.url === sub.url}
                      />
                    ))
                  )}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubtitleLanguageOptionLabel({
  code,
  name,
  alreadyAdded,
  tvMode,
}: {
  code: (typeof SUBDL_LANGUAGE_CODES)[number];
  name: string;
  alreadyAdded: boolean;
  tvMode: boolean;
}) {
  const { t } = useLingui();
  return (
    <span className={cn("flex items-center gap-2", tvMode ? "whitespace-nowrap" : "w-full min-w-0")}>
      <Flag lang={code} className={cn("shrink-0", tvMode ? "size-5" : "size-4")} />
      <span className={cn(!tvMode && "min-w-0 flex-1 truncate")}>{name}</span>
      {alreadyAdded && (
        <CheckIcon
          className={cn("shrink-0 text-primary", tvMode ? "size-5" : "size-4")}
          aria-label={t`Already added`}
        />
      )}
    </span>
  );
}

function SubtitleRow({
  subtitle,
  mediaTitle,
  downloadId,
  language,
  rowIndex,
  langFocusKey,
  tvMode,
  onDownload,
  isDownloading,
}: {
  subtitle: SubdlSubtitle;
  mediaTitle: string;
  downloadId: string;
  language: string;
  rowIndex: number;
  langFocusKey: string;
  tvMode: boolean;
  onDownload: (input: { downloadId: string; url: string; language: string; mediaTitle: string }) => void;
  isDownloading: boolean;
}) {
  const { t } = useLingui();
  const isBestMatch = isMatchingSubtitleRelease(subtitle.release_name, mediaTitle);

  const download = () =>
    onDownload({
      downloadId,
      url: subtitle.url,
      language,
      mediaTitle,
    });

  const rowLayoutClass = "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 overflow-hidden";

  const rowBody = (
    <>
      <div className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 items-start gap-3">
          {isBestMatch && (
            <StarIcon
              className={
                tvMode
                  ? "mt-1 size-6 shrink-0 fill-primary text-primary"
                  : "mt-0.5 size-4 shrink-0 fill-primary text-primary"
              }
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className={cn("truncate font-medium", tvMode ? "text-base" : "text-sm")} title={subtitle.release_name}>
              {subtitle.release_name}
            </p>
            <div
              className={cn(
                "text-muted-foreground mt-1 flex min-w-0 items-center gap-1.5",
                tvMode ? "text-sm" : "text-xs",
              )}
              title={`${subtitle.author} · ${subtitle.lang}`}
            >
              <Flag lang={subtitle.lang} className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {subtitle.author} · {subtitle.lang}
              </span>
              {subtitle.hi && (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded bg-muted font-medium",
                    tvMode ? "rounded-md px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]",
                  )}
                >
                  HI
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {tvMode ? (
        <span className="flex shrink-0 items-center gap-2 self-center rounded-md bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground">
          <DownloadIcon className="size-5" aria-hidden />
          {isDownloading ? <Trans>Adding…</Trans> : <Trans>Add</Trans>}
        </span>
      ) : (
        <Button
          variant="default"
          size="sm"
          className="shrink-0 self-center"
          disabled={isDownloading}
          onClick={download}
          icon={DownloadIcon}
        >
          {isDownloading ? <Trans>Adding…</Trans> : <Trans>Add</Trans>}
        </Button>
      )}
    </>
  );

  if (tvMode) {
    return (
      <li className="min-w-0">
        <TvFocusable
          focusRoot
          className={cn(
            rowLayoutClass,
            "gap-x-4 rounded-lg border-2 border-border/70 bg-card/40 p-4 text-left transition-colors",
          )}
          tv={{
            focusKey: tvSubtitleRowFocusKey(downloadId, rowIndex),
            onPress: download,
            accessibilityLabel: t`Add subtitle ${subtitle.release_name}`,
            enabled: !isDownloading,
            onArrowPress: (direction) => {
              if (direction === "up") {
                setFocus(langFocusKey);
                return false;
              }
              return true;
            },
          }}
        >
          {rowBody}
        </TvFocusable>
      </li>
    );
  }

  return <li className={cn(rowLayoutClass, "rounded-md border p-2 text-sm")}>{rowBody}</li>;
}
