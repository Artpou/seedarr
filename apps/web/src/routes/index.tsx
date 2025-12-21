import { createFileRoute } from "@tanstack/react-router";
import { useTmdb } from "@/hooks/use-tmdb";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { isLogged } = useTmdb();

  return (
    <div className="size-full flex flex-col">
      {isLogged ? (
        <div className="flex flex-col items-center justify-center gap-6 p-8">logged</div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 p-8">not logged</div>
      )}
    </div>
  );
}
