import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileExplorer } from "@/components/file-explorer";
import { api } from "@/lib/api";

export const Route = createFileRoute("/server")({
  component: ServerPage,
});

function ServerPage() {
  const [currentPath, setCurrentPath] = useState("/");

  const { data, isLoading } = useQuery({
    queryKey: ["freebox", "files", currentPath],
    queryFn: async () =>
      await api.freebox.files
        .get({
          $query: { path: currentPath },
        })
        .then((response) => response.data),
  });

  return (
    <div className="size-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">Freebox Explorer</h1>
      </div>
      <FileExplorer
        files={data?.files ?? []}
        currentPath={currentPath}
        isLoading={isLoading}
        onNavigate={setCurrentPath}
      />
    </div>
  );
}
