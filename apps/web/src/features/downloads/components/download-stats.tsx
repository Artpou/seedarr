import { Trans, useLingui } from "@lingui/react/macro";
import { formatBytes } from "@seedarr/shared";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ClapperboardIcon, HardDriveIcon, ServerIcon, TvIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatBlock } from "@/shared/components/stats/stat-block";
import { StatSurfaceGlow } from "@/shared/components/stats/stat-surface";
import { TooltipWrapper } from "@/shared/ui/tooltip-wrapper";

import { downloadQueries } from "@/features/downloads/hooks/download.queries";
import { ACTIVE_DOWNLOAD_INTERVAL } from "@/features/media/hooks/media.queries";
import { useStorageModule } from "@/features/module/hooks/use-module";

interface StorageSpace {
  seedarrUsed: number;
  diskUsed: number | null;
  diskTotal: number | null;
}

function StorageBar({ space, kind }: { space: StorageSpace; kind: "local" | "remote" }) {
  const { t } = useLingui();
  const { seedarrUsed, diskUsed, diskTotal } = space;
  const Icon = kind === "local" ? HardDriveIcon : ServerIcon;
  const label = kind === "local" ? t`Local storage` : t`Remote storage`;

  const seedarrPct = diskTotal ? Math.min(100, (seedarrUsed / diskTotal) * 100) : 100;
  const diskUsedPct = diskTotal && diskUsed != null ? Math.min(100, (diskUsed / diskTotal) * 100) : 0;

  let rightText: string | null = null;
  if (diskUsed != null && diskTotal != null) {
    rightText = `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`;
  } else if (diskTotal != null) {
    rightText = `${formatBytes(seedarrUsed)} / ${formatBytes(diskTotal)}`;
  }

  return (
    <TooltipWrapper tooltip={label}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
            <span>{label}</span>
            {rightText && <span className="tabular-nums">{rightText}</span>}
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            {diskTotal != null && diskUsed != null && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25 transition-[width] duration-500"
                style={{ width: `${diskUsedPct}%` }}
              />
            )}
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
                kind === "local" ? "bg-primary" : "bg-blue-500",
              )}
              style={{ width: `${seedarrPct}%` }}
            />
          </div>
          <p className="text-xs font-semibold tabular-nums text-foreground">
            {formatBytes(seedarrUsed)}
            <span className="ml-1 font-normal text-muted-foreground">
              <Trans>in library</Trans>
            </span>
          </p>
        </div>
      </div>
    </TooltipWrapper>
  );
}

const statIconClass = "size-4 text-muted-foreground";

export function LibraryStats() {
  const { t } = useLingui();
  const { isEnabled: storageEnabled } = useStorageModule();
  const { data: stats } = useSuspenseQuery({
    ...downloadQueries.stats(),
    refetchInterval: ({ state }) => {
      const s = state.data;
      if (!s) return false;
      return s.activeDownloads > 0 || s.downloadSpeed > 0 || s.uploadSpeed > 0 ? ACTIVE_DOWNLOAD_INTERVAL : false;
    },
  });

  const hasStorage = stats.storage.local || (storageEnabled && stats.storage.remote);
  const transferActive = stats.downloadSpeed > 0;
  const downloadActive = transferActive || stats.activeDownloads > 0;

  return (
    <div
      className={cn(
        "grid items-stretch gap-3",
        hasStorage
          ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,36rem)]"
          : "",
      )}
    >
      {hasStorage ? (
        <StatSurfaceGlow className="flex flex-col justify-center gap-4 p-4">
          {stats.storage.local && <StorageBar space={stats.storage.local} kind="local" />}
          {stats.storage.local && <StorageBar space={stats.storage.local} kind="remote" />}
        </StatSurfaceGlow>
      ) : null}

      <StatSurfaceGlow className="flex h-full min-h-[5.5rem] w-full items-center justify-center px-3 py-4 sm:px-5">
        <div className="mx-auto grid w-full max-w-md grid-cols-3 items-center justify-items-center">
          <StatBlock
            value={stats.movies.count}
            label={<Trans>Movies</Trans>}
            sublabel={formatBytes(stats.movies.totalSize)}
            icon={<ClapperboardIcon className={statIconClass} aria-hidden />}
            className="flex w-full justify-center border-r border-border/50 px-2 sm:px-3"
          />
          <StatBlock
            value={stats.tv.count}
            label={<Trans>TV</Trans>}
            sublabel={formatBytes(stats.tv.totalSize)}
            icon={<TvIcon className={statIconClass} aria-hidden />}
            className="flex w-full justify-center border-r border-border/50 px-2 sm:px-3"
          />
          <StatBlock
            value={
              transferActive ? (
                <span className="text-primary">{formatBytes(stats.downloadSpeed)}/s</span>
              ) : downloadActive ? (
                <span className="text-primary">—</span>
              ) : (
                "—"
              )
            }
            label={<Trans>Download</Trans>}
            sublabel={
              <span className={cn(downloadActive && "text-primary")}>{t`${stats.activeDownloads} active`}</span>
            }
            icon={
              <ArrowDownIcon
                className={cn(
                  "size-4",
                  downloadActive ? "text-primary" : "text-muted-foreground",
                  transferActive && "animate-pulse",
                )}
                aria-hidden
              />
            }
            className="flex w-full justify-center px-2 sm:px-3"
          />
        </div>
      </StatSurfaceGlow>
    </div>
  );
}
