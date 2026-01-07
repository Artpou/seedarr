import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authGuard } from "@/modules/auth/auth.guard";
import { mediaSelectSchema } from "@/modules/media/media.dto";
import type { HonoVariables } from "@/types/hono";
import { TorrentService } from "./torrent.service";

const searchSchema = z.object({
  media: mediaSelectSchema,
  indexerId: z.string(),
});

export const torrentRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard)
  .get("/indexers", async (c) => c.json(await TorrentService.fromContext(c).getIndexers()))
  .post("/search", zValidator("json", searchSchema), async (c) => {
    const { media, indexerId } = c.req.valid("json");
    return c.json(await TorrentService.fromContext(c).searchTorrents(media, indexerId));
  });

export type TorrentRoutesType = typeof torrentRoutes;
