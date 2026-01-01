import { createSelectSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { media } from "@/db/schema";
import { authGuard } from "@/modules/auth/auth.guard";
import { TorrentService } from "./torrent.service";

const mediaSchema = createSelectSchema(media);

export const torrentRoutes = new Elysia({ prefix: "/torrents" })
  .use(authGuard())
  .get("/indexers", async ({ user }) => {
    return new TorrentService(user).getIndexers();
  })
  .post(
    "/search",
    async ({ user, body }) => {
      return new TorrentService(user).searchTorrents(body.media, body.indexerId);
    },
    {
      body: t.Object({
        media: mediaSchema,
        indexerId: t.String(),
      }),
    },
  );
