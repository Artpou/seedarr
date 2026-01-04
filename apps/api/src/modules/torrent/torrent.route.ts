import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { convertMkvToMp4Stream } from "@/helpers/video.helper";
import { authGuard } from "@/modules/auth/auth.guard";
import { requireRole } from "@/modules/auth/role.guard";
import { mediaSelectSchema } from "@/modules/media/media.dto";
import type { HonoVariables } from "@/types/hono";
import { downloadTorrentSchema } from "./torrent.dto";
import { TorrentService } from "./torrent.service";
import { TorrentDownloadService } from "./torrent-download.service";

const searchSchema = z.object({
  media: mediaSelectSchema,
  indexerId: z.string(),
});

export const torrentRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard)
  .use("/download/*", requireRole("member"))
  .get("/indexers", async (c) => c.json(await TorrentService.fromContext(c).getIndexers()))
  .post("/search", zValidator("json", searchSchema), async (c) => {
    const { media, indexerId } = c.req.valid("json");
    return c.json(await TorrentService.fromContext(c).searchTorrents(media, indexerId));
  })
  .post("/download", zValidator("json", downloadTorrentSchema), async (c) => {
    return c.json(await TorrentDownloadService.fromContext(c).startDownload(c.req.valid("json")));
  })
  .get("/download", async (c) => {
    return c.json(await TorrentDownloadService.fromContext(c).listTorrents());
  })
  // Pause/resume routes MUST come before /download/:id to avoid route conflicts
  .post("/download/:id/pause", async (c) => {
    const torrent = await TorrentDownloadService.fromContext(c).getTorrentById(c.req.param("id"));
    const user = c.get("user");

    // Only owner/admin or the user who created can pause
    if (torrent?.userId !== user.id && !["owner", "admin"].includes(user.role)) {
      throw new Error("Unauthorized");
    }

    await TorrentDownloadService.fromContext(c).pauseTorrent(c.req.param("id"));
    return c.json({ success: true });
  })
  .post("/download/:id/resume", async (c) => {
    const torrent = await TorrentDownloadService.fromContext(c).getTorrentById(c.req.param("id"));
    const user = c.get("user");

    // Only owner/admin or the user who created can resume
    if (torrent?.userId !== user.id && !["owner", "admin"].includes(user.role)) {
      throw new Error("Unauthorized");
    }

    await TorrentDownloadService.fromContext(c).resumeTorrent(c.req.param("id"));
    return c.json({ success: true });
  })
  .get("/download/:id", async (c) => {
    const torrent = await TorrentDownloadService.fromContext(c).getTorrentById(c.req.param("id"));
    if (!torrent) throw new Error("Torrent not found");
    return c.json(torrent);
  })
  .delete("/download/:id", async (c) => {
    const torrent = await TorrentDownloadService.fromContext(c).getTorrentById(c.req.param("id"));
    const user = c.get("user");

    // Only owner/admin or the user who created can delete
    if (torrent?.userId !== user.id && !["owner", "admin"].includes(user.role)) {
      throw new Error("Unauthorized");
    }

    await TorrentDownloadService.fromContext(c).deleteTorrent(c.req.param("id"));
    return c.json({ success: true });
  })
  // OPTIONAL: Streaming route (legacy - direct stream without conversion)
  .get("/download/:id/stream", async (c) => {
    const result = await TorrentDownloadService.fromContext(c).getStreamForTorrent(
      c.req.param("id"),
    );

    if (!result) {
      return c.json({ error: "No video file available" }, 404);
    }

    const { stream: nodeStream, size } = result;

    // Handle range requests for seeking
    const range = c.req.header("range");
    if (range) {
      // Parse range header and set appropriate response headers
      // For now, we'll return the full stream without range support
      // TODO: Implement proper range request handling for video seeking
    }

    c.header("Content-Type", "video/mp4");
    c.header("Content-Length", size.toString());
    c.header("Accept-Ranges", "bytes");

    // Convert Node.js stream to Web ReadableStream
    return c.body(nodeStream as unknown as ReadableStream);
  })
  // Convert route: Automatically detects MKV and converts to MP4
  .get("/download/:id/convert", async (c) => {
    const result = await TorrentDownloadService.fromContext(c).getStreamForTorrent(
      c.req.param("id"),
    );

    if (!result) {
      return c.json({ error: "No video file available" }, 404);
    }

    const { stream: nodeStream, fileName } = result;
    const isMkv = fileName.toLowerCase().endsWith(".mkv");

    if (isMkv) {
      const convertedStream = convertMkvToMp4Stream(nodeStream);
      c.header("Content-Type", "video/mp4");
      c.header("Transfer-Encoding", "chunked");
      return c.body(convertedStream as unknown as ReadableStream);
    }

    // Determine content type based on file extension
    let contentType = "video/mp4";
    if (fileName.toLowerCase().endsWith(".webm")) {
      contentType = "video/webm";
    } else if (fileName.toLowerCase().endsWith(".avi")) {
      contentType = "video/x-msvideo";
    } else if (fileName.toLowerCase().endsWith(".mov")) {
      contentType = "video/quicktime";
    }

    c.header("Content-Type", contentType);
    c.header("Accept-Ranges", "bytes");
    return c.body(nodeStream as unknown as ReadableStream);
  });

export type TorrentRoutesType = typeof torrentRoutes;
