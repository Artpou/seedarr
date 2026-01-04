import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { authGuard } from "@/modules/auth/auth.guard";
import { requireRole } from "@/modules/auth/role.guard";
import type { HonoVariables } from "@/types/hono";
import { IndexerManagerService } from "./indexer-manager.service";

const createIndexerManagerSchema = z.object({
  name: z.enum(["prowlarr", "jackett"]),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  selected: z.boolean().optional(),
});

export const indexerManagerRoutes = new Hono<{ Variables: HonoVariables }>()
  .use("*", authGuard)
  .use("*", requireRole("member"))
  .get("/", async (c) => {
    return c.json(await IndexerManagerService.fromContext(c).list());
  })
  .post("/", zValidator("json", createIndexerManagerSchema), async (c) => {
    const body = c.req.valid("json");
    return c.json(await IndexerManagerService.fromContext(c).create(body));
  });

export type IndexerManagerRoutesType = typeof indexerManagerRoutes;
