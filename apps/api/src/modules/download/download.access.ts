import { NotFoundError } from "@/shared/errors/error";

import { downloadRepository } from "@/modules/download/download.repository";
import type { Download } from "@/modules/download/download.schema";

/** Single gate for UI/API reads and mutations that must respect library visibility. */
export async function getVisibleDownload(id: string): Promise<Download> {
  const row = await downloadRepository.findVisible(id);
  if (!row) throw new NotFoundError("Download");
  return row;
}
