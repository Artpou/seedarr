import type * as React from "react";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { controlFillClass } from "@/shared/ui/control-surface";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function TabsList({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { size?: "default" | "lg" }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        controlFillClass,
        "inline-flex w-fit items-center justify-center rounded-md p-[3px] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { size?: "default" | "lg" }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors",
        "hover:bg-muted/40 hover:text-foreground",
        "data-[state=active]:bg-primary/50 data-[state=active]:text-foreground data-[state=active]:shadow-none",
        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3 data-[state=active]:[&_svg]:opacity-80",
        size === "lg" && "gap-2 px-3 py-2 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
