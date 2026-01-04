import { zValidator } from "@hono/zod-validator";
import { createSelectSchema } from "drizzle-zod";
import { Hono } from "hono";
import { z } from "zod";

import { media } from "@/db/schema";
import { authGuard } from "@/modules/auth/auth.guard";
import { requireRole } from "@/modules/auth/role.guard";
import type { HonoVariables } from "@/types/hono";
import { TorrentService } from "./torrent.service";
import { TorrentDownloadService } from "./torrent-download.service";

const mediaSchema = createSelectSchema(media);

const searchSchema = z.object({
  media: mediaSchema,
  indexerId: z.string(),
});

const downloadSchema = z.object({
  magnetUri: z.string(), // Can be either a magnet URI or a .torrent URL
  name: z.string(),
  mediaId: z.number().optional(),
  origin: z.string().optional(), // Tracker name
  quality: z.string().optional(), // Quality tier (SD, HD, 2K, 4K)
  language: z.string().optional(), // Content language
});

export const torrentRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard)
  .use("/download/*", requireRole("member"))
  .get("/indexers", async (c) => c.json(await TorrentService.fromContext(c).getIndexers()))
  .post("/search", zValidator("json", searchSchema), async (c) => {
    const { media, indexerId } = c.req.valid("json");
    return c.json(await TorrentService.fromContext(c).searchTorrents(media, indexerId));
  })
  .post("/download", zValidator("json", downloadSchema), async (c) => {
    const { magnetUri, name, mediaId, origin, quality, language } = c.req.valid("json");
    return c.json(
      await TorrentDownloadService.fromContext(c).startDownload(
        magnetUri,
        name,
        mediaId,
        origin,
        quality,
        language,
      ),
    );
  })
  .get("/download", async (c) => {
    return c.json(await TorrentDownloadService.fromContext(c).listTorrents());
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
  // OPTIONAL: Streaming route
  .get("/download/:id/stream", async (c) => {
    const result = TorrentDownloadService.fromContext(c).getStreamForTorrent(c.req.param("id"));

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
  });

export type TorrentRoutesType = typeof torrentRoutes;
