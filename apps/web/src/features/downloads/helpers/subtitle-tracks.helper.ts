import type { Download } from "@seedarr/sdk";

import { detectLanguage } from "@/shared/helpers/lang.helper";

import { getTorrentFiles } from "@/features/downloads/helpers/downloads.helper";

const VIDEO_EXTENSIONS = /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v)$/i;
const SUBTITLE_EXTENSIONS = /\.(srt|vtt|ass|ssa)$/i;

function mediaDir(filePath: string): string {
  const slash = filePath.lastIndexOf("/");
  return slash >= 0 ? filePath.slice(0, slash) : "";
}

/** Torrent paths are relative to the download folder; drop stray `downloads/` prefixes. */
function normalizeTorrentPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("downloads/") ? normalized.slice("downloads/".length) : normalized;
}

export interface SubtitleTrack {
  kind: "subtitles";
  label: string;
  srclang: string;
  src: string;
  default: boolean;
  format: "srt" | "vtt" | "ass" | "ssa";
}

function extractLangInfo(fileName: string): { label: string; srclang: string } {
  const nameWithoutExt = fileName.replace(/\.(srt|vtt|ass|ssa)$/i, "");
  const match2 = nameWithoutExt.match(/\.([a-z]{2})$/i);
  const match3 = nameWithoutExt.match(/\.([a-z]{3})$/i);
  const justCode2 = nameWithoutExt.match(/^([a-z]{2})$/i);
  const justCode3 = nameWithoutExt.match(/^([a-z]{3})$/i);
  const langInput = (match2?.[1] || match3?.[1] || justCode2?.[1] || justCode3?.[1] || nameWithoutExt).toLowerCase();
  const detected = detectLanguage(langInput);
  return {
    label: (detected?.name || nameWithoutExt).slice(0, 20),
    srclang: detected?.[1] ?? "en",
  };
}

/** Same-origin relative URLs — prefetched to blob: URLs before handing to movi-player. */
export function buildSubtitleTracks(download: Download, externalPaths: string[]): SubtitleTrack[] {
  const tracks: SubtitleTrack[] = [];
  const id = download.id;

  if (download.torrent?.files) {
    const torrentFiles = getTorrentFiles(download);
    const videoFiles = torrentFiles.filter((f) => VIDEO_EXTENSIONS.test(f.name));
    if (videoFiles.length > 0) {
      const largestVideo = videoFiles.sort((a, b) => b.length - a.length)[0];
      const videoPath = normalizeTorrentPath(largestVideo.path);
      const videoDir = mediaDir(videoPath);
      const videoBaseName = largestVideo.name.replace(/\.[^.]+$/, "");
      const topSegment = videoPath.split("/")[0] ?? "";

      const subtitleFiles = torrentFiles.filter((f) => {
        if (!SUBTITLE_EXTENSIONS.test(f.name)) return false;
        const subPath = normalizeTorrentPath(f.path);
        const fileBaseName = f.name.replace(/\.[^.]+$/, "");
        if (fileBaseName.startsWith(videoBaseName)) return true;
        if (topSegment && subPath.includes(topSegment)) return true;
        if (!videoDir) return true;
        return mediaDir(subPath) === videoDir;
      });

      const seenPaths = new Set<string>();
      for (let i = 0; i < subtitleFiles.length; i++) {
        const file = subtitleFiles[i];
        const relativePath = normalizeTorrentPath(file.path);
        if (seenPaths.has(relativePath)) continue;
        seenPaths.add(relativePath);
        const fileNameOnly = file.name.split("/").pop() || file.name;
        const { label, srclang } = extractLangInfo(fileNameOnly);
        tracks.push({
          kind: "subtitles",
          label,
          srclang: `${srclang}-${i}`,
          src: `/streaming/${id}/subtitles/${encodeURIComponent(relativePath)}`,
          default: i === 0 && tracks.length === 0,
          format: "vtt",
        });
      }
    }
  }

  const seenExternal = new Set(tracks.map((t) => t.src));
  for (let i = 0; i < externalPaths.length; i++) {
    const filePath = normalizeTorrentPath(externalPaths[i]);
    const fileName = filePath.split("/").pop() || filePath;
    const { label, srclang } = extractLangInfo(fileName);
    const src = `/streaming/${id}/subtitles/${encodeURIComponent(filePath)}`;
    if (seenExternal.has(src)) continue;
    seenExternal.add(src);
    tracks.push({
      kind: "subtitles",
      label,
      srclang: `${srclang}-ext-${i}`,
      src,
      default: tracks.length === 0,
      format: "vtt",
    });
  }

  if (tracks.length > 0 && !tracks.some((t) => t.default)) {
    tracks[0].default = true;
  }

  return tracks;
}

/** Normalize SRT → WebVTT for movi-player's cue parser. */
function ensureWebVtt(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const body = normalized.replace(
    /(\d{1,2}):(\d{2}):(\d{2}),(\d{3})/g,
    (_m, h: string, m: string, s: string, ms: string) => `${h.padStart(2, "0")}:${m}:${s}.${ms}`,
  );
  if (body.startsWith("WEBVTT")) return body.endsWith("\n") ? body : `${body}\n`;
  return `WEBVTT\n\n${body}\n`;
}

/** Prefetch with cookies → blob URLs (movi-player's fetch has no credentials). */
export async function resolveSubtitleTracksToBlobs(tracks: SubtitleTrack[]): Promise<{
  tracks: SubtitleTrack[];
  blobUrls: string[];
}> {
  const blobUrls: string[] = [];
  const resolved: SubtitleTrack[] = [];

  for (const track of tracks) {
    try {
      const res = await fetch(track.src, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = ensureWebVtt(await res.text());
      const url = URL.createObjectURL(new Blob([text], { type: "text/vtt;charset=utf-8" }));
      blobUrls.push(url);
      resolved.push({ ...track, src: url, format: "vtt" });
    } catch (error) {
      console.error("[subtitles] prefetch failed", track.src, error);
    }
  }

  return { tracks: resolved, blobUrls };
}
