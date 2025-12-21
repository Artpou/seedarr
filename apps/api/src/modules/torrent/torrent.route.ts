import { Elysia, t } from "elysia";
import { torrentService } from "./torrent.service";

export const torrentRoutes = new Elysia({ prefix: "/torrents" }).get(
  "/",
  async ({ query }) => {
    return await torrentService.searchTorrents(query);
  },
  {
    query: t.Object({
      q: t.Required(t.String()),
      t: t.Required(t.String()),
      year: t.Optional(t.String()),
    }),
  },
);
