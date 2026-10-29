import type { Resolution } from "@seedarr/contracts";

import { QUALITY_LEVELS } from "@/shared/components/select/select-quality";
import { detectLanguage } from "@/shared/helpers/lang.helper";

function languageMatchKey(tag: string): string {
  const iso = detectLanguage(tag)?.["1"];
  if (iso) return iso.toLowerCase();
  return tag.trim().toLowerCase();
}

function normalizeTorrentResolution(resolution: string | undefined): Resolution | null {
  if (!resolution) return null;
  const key = resolution.trim().toUpperCase();
  const fromLevels = QUALITY_LEVELS.find((level) => level && level.toUpperCase() === key);
  return fromLevels ?? null;
}

export function torrentMatchesQualityFilter(
  resolution: string | undefined,
  selectedQuality: Resolution | null,
): boolean {
  if (selectedQuality === null) return true;
  const normalized = normalizeTorrentResolution(resolution);
  if (!normalized) return false;
  return normalized.toUpperCase() === selectedQuality.toUpperCase();
}

export function torrentMatchesLanguageFilter(languages: string[] | undefined, selectedLanguage: string): boolean {
  if (selectedLanguage === "all") return true;
  if (!languages?.length) return false;
  const needle = languageMatchKey(selectedLanguage);
  return languages.some((lang) => languageMatchKey(lang) === needle);
}

export function collectTorrentLanguages(torrents: { mediaInfos?: { languages?: string[] } }[]): string[] {
  const byKey = new Map<string, string>();
  for (const torrent of torrents) {
    for (const lang of torrent.mediaInfos?.languages ?? []) {
      if (!lang) continue;
      const key = languageMatchKey(lang);
      if (!byKey.has(key)) byKey.set(key, lang);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}

export function torrentLanguageTags(torrent: { mediaInfos?: { languages?: string[] } }, fallback?: string): string[] {
  const fromTorrent = torrent.mediaInfos?.languages?.filter(Boolean) ?? [];
  if (fromTorrent.length > 0) {
    const seen = new Set<string>();
    return fromTorrent.filter((lang) => {
      const key = languageMatchKey(lang);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return fallback ? [fallback] : [];
}
