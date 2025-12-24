import { Elysia, t } from "elysia";
import { torrentService } from "./torrent.service";

export const torrentRoutes = new Elysia({ prefix: "/torrents" })
  .get(
    "/indexers",
    async ({ query, set }) => {
      try {
        return await torrentService.getIndexers(
          query.indexer as "jackett" | "prowlarr",
          query.apiKey,
        );
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        indexer: t.Required(t.Union([t.Literal("jackett"), t.Literal("prowlarr")])),
        apiKey: t.Required(t.String()),
      }),
    },
  )
  .get(
    "/search",
    async ({ query, set }) => {
      try {
        return await torrentService.searchTorrents({
          q: query.q,
          t: query.t,
          year: query.year,
          indexer: query.indexer as "jackett" | "prowlarr",
          apiKey: query.apiKey,
          indexerId: query.indexerId,
        });
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        q: t.Required(t.String()),
        t: t.Required(t.String()),
        year: t.Optional(t.String()),
        indexer: t.Required(t.Union([t.Literal("jackett"), t.Literal("prowlarr")])),
        apiKey: t.Required(t.String()),
        indexerId: t.Optional(t.String()),
      }),
    },
  );
