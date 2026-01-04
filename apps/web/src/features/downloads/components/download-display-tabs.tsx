import { Grid3x3Icon, ListIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export type DisplayMode = "grid" | "list";

interface DownloadDisplayTabsProps {
  value: DisplayMode;
  onValueChange: (value: DisplayMode) => void;
}

export function DownloadDisplayTabs({ value, onValueChange }: DownloadDisplayTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as DisplayMode)}>
      <TabsList className="h-auto p-1">
        <TabsTrigger
          value="grid"
          className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          aria-label="Grid view"
        >
          <Grid3x3Icon className="size-4" />
        </TabsTrigger>
        <TabsTrigger
          value="list"
          className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          aria-label="List view"
        >
          <ListIcon className="size-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
