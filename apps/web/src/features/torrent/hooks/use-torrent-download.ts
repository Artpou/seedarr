import type {
  DownloadTorrentInput,
  TorrentDownloadSerialized,
  TorrentLiveData,
} from "@basement/api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";

export type TorrentDownloadWithLive = TorrentDownloadSerialized & {
  live?: TorrentLiveData;
};

export type TorrentDownload = TorrentDownloadWithLive;

export function useStartDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DownloadTorrentInput) =>
      unwrap(
        api.torrents.download.$post({
          json: input,
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
    refetchInterval: 2000,
  });
}

export function useTorrentDownload(
  id: string,
  { refetchInterval = 0 }: { refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: ["torrent-download", id],
    queryFn: () =>
      unwrap<TorrentDownloadWithLive>(
        api.torrents.download[":id"].$get({
          param: { id },
        }),
      ),
    refetchInterval,
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

export function usePauseTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        api.torrents.download[":id"].pause.$post({
          param: { id },
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrent-downloads"] });
      queryClient.invalidateQueries({ queryKey: ["torrent-download"] });
    },
  });
}

export function useResumeTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        api.torrents.download[":id"].resume.$post({
          param: { id },
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrent-downloads"] });
      queryClient.invalidateQueries({ queryKey: ["torrent-download"] });
    },
  });
}
