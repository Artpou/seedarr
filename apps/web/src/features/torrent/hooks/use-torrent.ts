import type { Media } from "@basement/api/types";
import { useQueries } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";

import type { Torrent, TorrentIndexer } from "@/features/torrent/torrent";

export function useTorrents(media: Media | null | undefined, indexers: TorrentIndexer[]) {
  return useQueries({
    queries: indexers.map((indexer) => ({
      queryKey: ["torrents", media?.id, media?.type, indexer.id],
      queryFn: async () => {
        if (!media) return [];

        try {
          const data = await unwrap(
            api.torrents.search.$post({
              json: {
                media,
                indexerId: indexer.id,
              },
            }),
          );

          if (import.meta.env.DEV) {
            console.log(`[TORRENT] ${indexer.name} search results (${data.length} torrents):`, {
              total: data.length,
              withSeeders: data.filter((t: Torrent) => t.seeders > 0).length,
              sample: data[0]
                ? {
                    title: data[0].title,
                    guid: `${data[0].guid?.substring(0, 50)}...`,
                    downloadUrl: `${data[0].downloadUrl?.substring(0, 50)}...`,
                    magnetUrl: `${data[0].magnetUrl?.substring(0, 50)}...`,
                    link: `${data[0].link?.substring(0, 50)}...`,
                  }
                : null,
            });
          }
          return (data || []).filter((torrent: Torrent) => torrent.seeders > 0);
        } catch {
          return [];
        }
      },
      enabled: !!media?.id,
      retry: 1,
    })),
  });
}
