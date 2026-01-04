import { Hono } from "hono";

import { freeboxService } from "./freebox.service";

export const freeboxRoutes = new Hono().get("/files", async (c) => {
  try {
    const path = c.req.query("path") || "/";
    const files = await freeboxService.listFiles(path);
    return c.json({ path, files });
  } catch (error) {
    console.error("Failed to connect to Freebox:", error);
    return c.json({ error: "Failed to connect to Freebox" }, 500);
  }
});

export type FreeboxRoutesType = typeof freeboxRoutes;
