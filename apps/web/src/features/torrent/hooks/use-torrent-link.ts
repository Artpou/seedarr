import { getBaseUrl } from "@/lib/api";

export function useTorrentLink(id: string): string {
  return `${getBaseUrl()}/torrents/download/${id}/convert`;
}
