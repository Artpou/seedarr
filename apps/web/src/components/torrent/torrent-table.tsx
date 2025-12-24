import type { Torrent } from "@basement/api/types";
import { Trans } from "@lingui/react/macro";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Download, ListFilter, Plus } from "lucide-react";
import ms from "ms";
import { useState } from "react";
import { TorrentIndexersTable } from "@/components/torrent/torrent-indexers-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTorrentIndexer } from "@/hooks/use-torrent-indexer";
import { api } from "@/lib/api";

interface TorrentTableProps {
  search: string;
  year?: string;
}

export function TorrentTable({ search, year }: TorrentTableProps) {
  const { indexerType, apiKey } = useTorrentIndexer();

  const [visibleIndexers, setVisibleIndexers] = useState<Set<string>>(new Set());

  const { data: indexersResponse, error: indexersError } = useQuery({
    queryKey: ["indexers", indexerType, apiKey],
    queryFn: async () => {
      if (!apiKey) return { data: [] };
      return api.torrents.indexers.get({
        $query: { indexer: indexerType, apiKey },
      });
    },
    enabled: !!apiKey,
    staleTime: ms("1h"),
    retry: 1,
  });

  const indexers = Array.isArray(indexersResponse?.data) ? indexersResponse.data : [];

  const { recommended, others, queries } = useQueries({
    queries: indexers.map((indexer) => ({
      queryKey: ["torrents", indexerType, apiKey, search, year, indexer.id],
      queryFn: () => {
        if (!apiKey) throw new Error("API key is required");
        return api.torrents.search.get({
          $query: {
            q: search,
            t: "movie",
            year,
            indexer: indexerType,
            apiKey,
            indexerId: indexer.id,
          },
        });
      },
      enabled: !!search && !!apiKey,
      staleTime: ms("5m"),
      retry: 1,
    })),
    combine: (results) => {
      const recommended: Torrent[] = [];
      const others: Torrent[] = [];

      results.forEach((query, index) => {
        const indexerId = indexers[index]?.id;

        // Only include results from visible indexers
        if (
          query.data?.data &&
          indexerId &&
          visibleIndexers.has(indexerId) &&
          "recommended" in query.data.data &&
          "others" in query.data.data
        ) {
          recommended.push(...query.data.data.recommended);
          others.push(...query.data.data.others);
        }
      });

      return {
        recommended: recommended.sort((a, b) => b.seeders - a.seeders),
        others: others.sort((a, b) => b.seeders - a.seeders),
        queries: results,
      };
    },
  });

  const renderTable = (data: Torrent[], title: string, showEmpty = false) => {
    if (data.length === 0 && !showEmpty) return null;

    return (
      <div className="space-y-3">
        <h3 className="pl-1 text-sm font-bold tracking-wider text-muted-foreground uppercase">
          {title} ({data.length})
        </h3>
        <div className="w-full overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-full">
                  <Trans>Torrent Name</Trans>
                </TableHead>
                <TableHead>
                  <Trans>Size</Trans>
                </TableHead>
                <TableHead className="pr-8 text-right">
                  <Trans>Health</Trans>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((torrent) => (
                  <TableRow key={torrent.guid || torrent.link} className="relative group">
                    <TableCell className="w-full max-w-0">
                      <div className="flex flex-col gap-2">
                        <a
                          href={torrent.detailsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full font-medium truncate text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {torrent.title}
                        </a>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{torrent.tracker}</Badge>
                          {torrent.quality && <Badge variant="secondary">{torrent.quality}</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-muted-foreground">
                        {(torrent.size / 1e9).toFixed(2)} GB
                      </span>
                    </TableCell>
                    <TableCell className="relative">
                      <div className="flex items-center justify-end gap-3 pr-4">
                        <div className="flex items-center gap-1 font-bold text-green-500">
                          <ArrowUp className="size-3" />
                          <span className="text-xs">{torrent.seeders}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-destructive">
                          <ArrowDown className="size-3" />
                          <span className="text-xs">{torrent.peers}</span>
                        </div>
                      </div>
                      <div className="absolute inset-y-0 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" asChild>
                          <a href={torrent.link}>
                            <Plus /> <Trans>Download</Trans>
                          </a>
                        </Button>
                        <Button onClick={(e) => e.stopPropagation()}>
                          <Download /> <Trans>Add</Trans>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center">
                    <div className="p-10 border border-dashed rounded-sm bg-muted border-border">
                      <p className="font-bold uppercase text-muted-foreground">
                        <Trans>No torrents found</Trans>
                      </p>
                      <p className="mt-1 text-xs uppercase text-muted-foreground/50">
                        <Trans>Try adjusting your search query</Trans>
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (indexersError) {
    return (
      <div className="w-full">
        <div className="p-10 border border-dashed rounded-sm bg-muted border-destructive/50">
          <p className="font-bold uppercase text-destructive">
            <Trans>Failed to load indexers</Trans>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {indexersError instanceof Error ? (
              indexersError.message
            ) : (
              <Trans>Unknown error occurred</Trans>
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <Trans>Please check your API key and make sure {indexerType} is running.</Trans>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="xl:hidden mb-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <ListFilter className="h-4 w-4" />
              <Trans>Indexers</Trans> ({indexers.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>
                <Trans>Torrent Indexers</Trans>
              </SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <TorrentIndexersTable
                indexers={indexers}
                torrentQueries={queries}
                onVisibilityChange={setVisibleIndexers}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="w-full xl:grid xl:grid-cols-4 xl:gap-6">
        <div className="xl:col-span-3 space-y-8">
          {recommended.length > 0 || others.length > 0 ? (
            <>
              {renderTable(recommended, "Recommended Torrents")}
              {renderTable(others, "Other Torrents")}
            </>
          ) : (
            renderTable([], "Results", true)
          )}
        </div>

        <div className="hidden xl:block xl:col-span-1">
          <TorrentIndexersTable
            indexers={indexers}
            torrentQueries={queries}
            onVisibilityChange={setVisibleIndexers}
          />
        </div>
      </div>
    </div>
  );
}
