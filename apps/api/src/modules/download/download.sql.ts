import { inArray, type SQL, sql } from "drizzle-orm";

import { download } from "@/modules/download/download.schema";
import { moduleRepository } from "@/modules/module/module.repository";

/** Hide remote-only downloads that belong to a disabled storage (keep torrent downloads). */
export async function visibleDownloadSql(): Promise<SQL | undefined> {
  const disabledIds = await moduleRepository.listDisabledStorageModuleIds();
  const storageEnabled = (await moduleRepository.getEnabledStorageModuleId()) != null;
  // Local HARDLINK library sync stores paths in remoteLocation with null moduleStorageId.
  const hardlinkConfigured = Boolean(
    process.env.HARDLINK_PATH?.trim() ||
      process.env.HARDLINK_MOVIE_PATH?.trim() ||
      process.env.HARDLINK_TV_PATH?.trim(),
  );

  const hideDisabled = disabledIds.length > 0 ? inArray(download.moduleStorageId, disabledIds) : sql`0`;

  const hideLegacyRemote =
    storageEnabled || hardlinkConfigured
      ? sql`0`
      : sql`${download.moduleStorageId} IS NULL AND ${download.remoteLocation} IS NOT NULL`;

  return sql`NOT (
      ${download.torrent} IS NULL AND (${hideDisabled} OR ${hideLegacyRemote})
    )`;
}
