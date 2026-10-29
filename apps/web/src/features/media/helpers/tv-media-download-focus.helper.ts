import type { Download } from "@seedarr/sdk";

import { getDownloadStatus } from "@/features/downloads/helpers/downloads.helper";
import { tvMediaDownloadActionFocusKey } from "@/features/tv-mode/tv-focus-keys";

type DownloadAction = Parameters<typeof tvMediaDownloadActionFocusKey>[3];

export function tvMediaDownloadPanelFocusKey(
  mediaType: "movie" | "tv",
  mediaId: number | string,
  download: Download,
  storageRemoteEnabled: boolean,
): string {
  const fk = (action: DownloadAction) => tvMediaDownloadActionFocusKey(mediaType, mediaId, download.id, action);

  const status = getDownloadStatus(download);
  const isPaused = status === "paused";
  const isCompleted = status === "completed";
  const isActive =
    Boolean(download.torrent && !download.torrent.done && !isPaused) || Boolean(download.torrent?.transferring);
  const hasActiveTorrentSession = isActive || isPaused;
  const showProgress = isActive || isPaused;
  const canTransfer =
    Boolean(download.torrent?.done && !download.remoteLocation && !download.torrent?.transferring) &&
    storageRemoteEnabled;

  if (showProgress) return fk("pause-resume");
  if (hasActiveTorrentSession && !isCompleted) return fk("recheck");
  if (canTransfer) return fk("transfer");
  return fk("change-media");
}
