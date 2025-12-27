import type { Torrent } from "@basement/api/types";
import { Trans } from "@lingui/react/macro";
import type { UseQueryResult } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Download, ListFilter, Plus } from "lucide-react";
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

interface Indexer {
  id: string;
  name: string;
}

interface TorrentTableProps {
  recommended: Torrent[];
  others: Torrent[];
  indexers: Indexer[];
  torrentQueries: UseQueryResult<unknown, Error>[];
  visibleIndexers: Set<string>;
  onVisibilityChange: (visibleIndexers: Set<string>) => void;
}

export function TorrentTable({
  recommended,
  others,
  indexers,
  torrentQueries,
  onVisibilityChange,
}: TorrentTableProps) {
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
                torrentQueries={torrentQueries}
                onVisibilityChange={onVisibilityChange}
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
            torrentQueries={torrentQueries}
            onVisibilityChange={onVisibilityChange}
          />
        </div>
      </div>
    </div>
  );
}
