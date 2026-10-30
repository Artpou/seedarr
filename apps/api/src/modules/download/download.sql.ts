import { inArray, type SQL, sql } from "drizzle-orm";

import { getDownloadsRoot } from "@/shared/helpers/path.helper";

import { download } from "@/modules/download/download.schema";
import { resolveLibraryBase } from "@/modules/download/local/local-library-hardlink";
import { moduleRepository } from "@/modules/module/module.repository";
import path from "node:path";

function localLibraryPathLikeSql(): SQL {
  const prefixes = new Set<string>([path.resolve(getDownloadsRoot())]);
  for (const mediaType of ["movie", "tv"] as const) {
    const base = resolveLibraryBase(mediaType);
    if (base) prefixes.add(path.resolve(base));
  }

  const clauses = [...prefixes].map(
    (prefix) =>
      sql`(${download.remoteLocation} = ${prefix} OR ${download.remoteLocation} LIKE ${`${prefix}${path.sep}%`})`,
  );
  if (clauses.length === 0) return sql`0`;
  if (clauses.length === 1) return clauses[0];
  return sql`(${sql.join(clauses, sql` OR `)})`;
}

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

  const hideDisabled =
    disabledIds.length > 0
      ? sql`${download.moduleStorageId} IS NOT NULL AND ${inArray(download.moduleStorageId, disabledIds)}`
      : sql`0`;

  const hideLegacyRemote =
    storageEnabled || hardlinkConfigured
      ? sql`0`
      : sql`${download.moduleStorageId} IS NULL AND ${download.remoteLocation} IS NOT NULL AND NOT ${localLibraryPathLikeSql()}`;

  return sql`NOT (
      ${download.torrent} IS NULL AND (${hideDisabled} OR ${hideLegacyRemote})
    )`;
}
