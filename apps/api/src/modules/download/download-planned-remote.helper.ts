import type { Download } from "@/modules/download/download.schema";
import { getOrganizedMediaRelativePath } from "@/modules/download/download-staging-path.helper";
import { mediaRepository } from "@/modules/media/media.repository";
import { moduleRepository } from "@/modules/module/module.repository";
import { remoteStorageService } from "@/modules/storage-config/remote/remote-storage.service";

/** Target remote folder for a download (set at start when remote storage is enabled). */
export async function getPlannedRemoteDownloadFields(
  media: { id: number; type: string; title: string; release_date: string | null },
  torrentLabel: string,
): Promise<Pick<Download, "remoteLocation" | "moduleStorageId"> | null> {
  if (!(await remoteStorageService.isEnabled())) return null;

  const mediaRow = await mediaRepository.find(media.id);
  const paths = await remoteStorageService.getMediaPaths();
  const storageModuleId = await moduleRepository.getEnabledStorageModuleId();
  if (!storageModuleId) return null;

  if (!mediaRow || (mediaRow.type !== "movie" && mediaRow.type !== "tv")) {
    const remotePath = await remoteStorageService.resolveTransferPath(torrentLabel, null);
    return { remoteLocation: remotePath, moduleStorageId: storageModuleId };
  }

  const basePath = mediaRow.type === "tv" ? paths.tvPath : paths.moviePath;
  const remotePath = getOrganizedMediaRelativePath(mediaRow, torrentLabel, basePath);
  return { remoteLocation: remotePath, moduleStorageId: storageModuleId };
}
