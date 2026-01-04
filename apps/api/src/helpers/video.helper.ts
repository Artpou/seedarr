import ffmpeg from "fluent-ffmpeg";

import type { TorrentQuality } from "@/modules/torrent/torrent.dto";
import { PassThrough, Readable } from "node:stream";

/**
 * Convert MKV stream to MP4 using ffmpeg with stream copy (remux without re-encoding)
 * @param inputStream - The input video stream (MKV)
 * @returns A readable stream of the converted MP4 video
 */
export function convertMkvToMp4Stream(inputStream: NodeJS.ReadableStream): NodeJS.ReadableStream {
  const outputStream = new PassThrough();

  const command = ffmpeg(inputStream as Readable)
    .outputFormat("mp4")
    .outputOptions([
      "-c:v copy",
      "-c:a copy",
      "-movflags frag_keyframe+empty_moov+default_base_moof",
      "-f mp4",
    ])
    .on("error", (err) => {
      outputStream.destroy(err);
    });

  command.pipe(outputStream, { end: true });
  return outputStream;
}

export function getTorrentQuality(title: string): TorrentQuality {
  const t = title.toLowerCase();

  if (t.includes("2160p") || t.includes("4k") || t.includes("uhd")) {
    return "4K";
  }

  if (t.includes("1440p") || t.includes("2k")) {
    return "2K";
  }

  if (t.includes("1080p") || t.includes("720p") || t.includes("hdrip") || t.includes("bluray")) {
    return "HD";
  }

  if (
    t.includes("480p") ||
    t.includes("360p") ||
    t.includes("dvdrip") ||
    t.includes("webrip") ||
    t.includes("cam") ||
    t.includes("ts")
  ) {
    return "SD";
  }

  return undefined;
}

export function getLanguageFromTitle(title: string): string | undefined {
  const t = title.toLowerCase();
  if (t.includes("english")) {
    return "en";
  }
  if (t.includes("french")) {
    return "fr";
  }
  if (t.includes("spanish")) {
    return "es";
  }
  return undefined;
}
