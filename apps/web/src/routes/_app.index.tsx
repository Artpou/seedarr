import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <Navigate
      to="/movies"
      search={{
        sort_by: "popularity.desc",
        with_genres: undefined,
        with_watch_providers: undefined,
      }}
    />
  );
}
