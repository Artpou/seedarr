import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { authGuard } from "@/modules/auth/auth.guard";
import type { HonoVariables } from "@/types/hono";
import { mediaSelectSchema, mediaStatusBatchSchema } from "./media.dto";
import { MediaService } from "./media.service";
import { MediaHistoryService } from "./media-history.service";
import { MediaLikeService } from "./media-like.service";
import { MediaWatchListService } from "./media-watch-list.service";

export const mediaRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard)
  // Specific routes MUST come before generic /:id route
  .get("/recently-viewed", async (c) => {
    const type = c.req.query("type") as "movie" | "tv" | undefined;
    const page = c.req.query("page") ? Number(c.req.query("page")) : undefined;
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
    return c.json(await MediaHistoryService.fromContext(c).getRecentlyViewed(type, page, limit));
  })
  .get("/like", async (c) => {
    const type = c.req.query("type") as "movie" | "tv" | undefined;
    const page = c.req.query("page") ? Number(c.req.query("page")) : undefined;
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
    return c.json(await MediaLikeService.fromContext(c).getLiked(type, page, limit));
  })
  .get("/watch-list", async (c) => {
    const type = c.req.query("type") as "movie" | "tv" | undefined;
    const page = c.req.query("page") ? Number(c.req.query("page")) : undefined;
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
    return c.json(await MediaWatchListService.fromContext(c).getWatchList(type, page, limit));
  })
  .post("/status/batch", zValidator("json", mediaStatusBatchSchema), async (c) => {
    const { mediaIds } = c.req.valid("json");
    return c.json(await MediaService.fromContext(c).getMediaStatusBatch(mediaIds));
  })
  .post("/track", zValidator("json", mediaSelectSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await MediaHistoryService.fromContext(c).track(body));
  })
  .post("/like", zValidator("json", mediaSelectSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await MediaLikeService.fromContext(c).toggle(body));
  })
  .post("/watch-list", zValidator("json", mediaSelectSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await MediaWatchListService.fromContext(c).toggle(body));
  })
  // Generic routes with parameters come LAST
  .get("/:id", async (c) => {
    return c.json(await MediaService.fromContext(c).get(Number(c.req.param("id"))));
  })
  .get("/:id/status", async (c) => {
    return c.json(await MediaService.fromContext(c).getMediaStatus(Number(c.req.param("id"))));
  });

export type MediaRoutesType = typeof mediaRoutes;
