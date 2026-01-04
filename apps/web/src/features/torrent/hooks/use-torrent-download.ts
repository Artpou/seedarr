import type { TorrentDownloadSerialized, TorrentLiveData } from "@basement/api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, getBaseUrl, unwrap } from "@/lib/api";

/**
 * Torrent download with optional live data from WebTorrent
 * Uses serialized version (Date as string for JSON compatibility)
 */
export type TorrentDownloadWithLive = TorrentDownloadSerialized & {
  live?: TorrentLiveData;
};

// Re-export for backward compatibility
export type TorrentDownload = TorrentDownloadWithLive;

export function useStartDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      magnetUri,
      name,
      mediaId,
      origin,
      quality,
      language,
    }: {
      magnetUri: string;
      name: string;
      mediaId?: number;
      origin?: string;
      quality?: string;
      language?: string;
    }) =>
      unwrap(
        api.torrents.download.$post({
          json: { magnetUri, name, mediaId, origin, quality, language },
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrent-downloads"] });
    },
  });
}

export function useTorrentDownloads() {
  return useQuery({
    queryKey: ["torrent-downloads"],
    queryFn: () => unwrap<TorrentDownloadWithLive[]>(api.torrents.download.$get()),
    refetchInterval: 2000, // Poll every 2 seconds for live updates
  });
}

export function useTorrentDownload(id: string) {
  return useQuery({
    queryKey: ["torrent-download", id],
    queryFn: () =>
      unwrap<TorrentDownloadWithLive>(
        api.torrents.download[":id"].$get({
          param: { id },
        }),
      ),
    refetchInterval: 1000, // Poll every second for detail view
  });
}

export function useDeleteTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        api.torrents.download[":id"].$delete({
          param: { id },
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrent-downloads"] });
    },
  });
}

// TODO: Add pause/resume endpoints to API routes (torrent.route.ts)
export function usePauseTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        fetch(`${getBaseUrl()}/torrents/download/${id}/pause`, {
          method: "POST",
          credentials: "include",
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrent-downloads"] });
    },
  });
}

// TODO: Add pause/resume endpoints to API routes (torrent.route.ts)
export function useResumeTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        fetch(`${getBaseUrl()}/torrents/download/${id}/resume`, {
          method: "POST",
          credentials: "include",
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrent-downloads"] });
    },
  });
}
