import { Skeleton } from "@/shared/ui/skeleton";

import type { TorrentDownload } from "@/features/torrent/hooks/use-torrent-download";
import { DownloadCard } from "./download-card";

interface DownloadsGridProps {
  items: TorrentDownload[];
  isLoading?: boolean;
  withLoading?: boolean;
}

export function DownloadsGrid({
  items,
  isLoading = false,
  withLoading = true,
}: DownloadsGridProps) {
  if (!isLoading && (!items || !items.length)) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
      {items.map((torrent) => (
        <div
          key={torrent.id}
          className="hover:border-primary/50 border-2 border-transparent rounded-xl"
        >
          <DownloadCard torrent={torrent} inGrid />
        </div>
      ))}
      {withLoading &&
        isLoading &&
        Array.from({ length: 20 }, (_, i) => (
          <Skeleton key={`skeleton-${i.toString()}`} className="aspect-2/3 w-full rounded-md" />
        ))}
    </div>
  );
}
