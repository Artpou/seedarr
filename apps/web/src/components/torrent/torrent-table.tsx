import type { Torrent } from "@basement/api/types";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Download, Plus } from "lucide-react";
import ms from "ms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

interface TorrentTableProps {
  search: string;
  year?: string;
}

export function TorrentTable({ search, year }: TorrentTableProps) {
  const { data: torrentsResponse, isLoading } = useQuery({
    queryKey: ["torrents", search],
    queryFn: async () => {
      if (!search) return { data: [] };
      return await api.torrents.get({
        $query: { q: search, t: "movie", year: year },
      });
    },
    enabled: !!search,
    staleTime: ms("10 minutes"),
  });

  const torrents: Torrent[] = torrentsResponse?.data || [];

  return (
    <div className="rounded-sm border border-border overflow-hidden w-full">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-full">Torrent Name</TableHead>
            <TableHead>Tracker</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="text-right pr-8">Health</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={`skeleton-${i.toString()}`}>
                <TableCell className="w-full">
                  <div className="h-5 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted animate-pulse rounded w-16" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted animate-pulse rounded w-12" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted animate-pulse rounded w-16" />
                </TableCell>
                <TableCell>
                  <div className="h-5 bg-muted animate-pulse rounded w-20 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : torrents.length > 0 ? (
            torrents.map((torrent) => (
              <TableRow key={torrent.Guid || torrent.Link} className="group relative">
                <TableCell className="w-full max-w-0">
                  <a
                    href={torrent.Details}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium truncate text-muted-foreground group-hover:text-foreground transition-colors block text-left w-full hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {torrent.Title}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 h-4 bg-primary/10 border-primary/40 text-primary rounded-none font-black uppercase tracking-wider"
                  >
                    {torrent.Tracker}
                  </Badge>
                </TableCell>
                <TableCell>
                  {torrent.quality && (
                    <Badge
                      variant="secondary"
                      className="font-black text-[10px] px-1.5 h-5 rounded-sm"
                    >
                      {torrent.quality}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground font-medium">
                    {(torrent.Size / 1e9).toFixed(2)} GB
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-3 pr-4">
                    <div className="flex items-center gap-1 text-green-500 font-bold">
                      <ArrowUp className="size-3" />{" "}
                      <span className="text-xs">{torrent.Seeders}</span>
                    </div>
                    <div className="flex items-center gap-1 text-destructive font-bold">
                      <ArrowDown className="size-3" />{" "}
                      <span className="text-xs">{torrent.Peers}</span>
                    </div>
                  </div>
                </TableCell>
                <div className="absolute gap-1 inset-y-0 right-2 flex items-center opacity-0 group-hover:opacity-100 z-10">
                  <Button variant="secondary" size="sm" className="uppercase" asChild>
                    <a href={torrent.Link}>
                      <Plus /> Download
                    </a>
                  </Button>
                  <Button size="sm" className="uppercase" onClick={(e) => e.stopPropagation()}>
                    <Download /> Add
                  </Button>
                </div>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                <div className="p-10 bg-muted text-center border border-dashed border-border rounded-sm">
                  <p className="text-muted-foreground font-bold uppercase">No torrents found</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 uppercase">
                    Try adjusting your search query
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
