import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useIndexers() {
  return useQuery({
    queryKey: ["torrent-indexers"],
    queryFn: async () => {
      const response = await api.torrents.indexers.get();
      return response.data;
    },
  });
}
