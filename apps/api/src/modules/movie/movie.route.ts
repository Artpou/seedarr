import { Elysia, t } from "elysia";
import { movieService } from "./movie.service";

export const movieRoutes = new Elysia({ prefix: "/movies" })
  .get(
    "/",
    async ({ query, request }) => {
      if (!query.search) throw new Error("Search query is required");

      const search = query.search;
      const apiKey = request.headers.get("Authorization");
      console.log(apiKey ? "logged" : "unlogged");

      return await movieService.search(search, apiKey);
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, request }) => {
      const apiKey = request.headers.get("Authorization");
      console.log(apiKey ? "logged" : "unlogged");
      return await movieService.getMovie(params.id, apiKey);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    "/:id/watch-providers",
    async ({ params, request }) => {
      const apiKey = request.headers.get("Authorization");
      return await movieService.getWatchProviders(params.id, apiKey);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
