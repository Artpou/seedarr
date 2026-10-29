import type { ReactNode } from "react";

import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { CheckIcon, ChevronDownIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@/shared/ui/dropdrawer";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

type ResponsiveTabOption = {
  value: string;
  label: ReactNode;
  icon?: LucideIcon;
};

interface ResponsiveTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ResponsiveTabOption[];
  className?: string;
  listClassName?: string;
  /** Force select/drawer UI even on desktop (useful for many options). */
  forceSelect?: boolean;
  /** Spatial-nav focus keys: `{prefix}-{option.value}` per tab. */
  tvFocusKeyPrefix?: string;
  /** ArrowDown from a tab jumps into panel content (TV). */
  tvGetDownFocusKey?: (tabValue: string) => string | undefined;
}

export function ResponsiveTabs({
  value,
  onValueChange,
  options,
  className,
  listClassName,
  forceSelect = false,
  tvFocusKeyPrefix,
  tvGetDownFocusKey,
}: ResponsiveTabsProps) {
  const isMobile = useIsMobile();
  const tvMode = useTvMode();
  const useSelect = forceSelect || ((isMobile || options.length > 8) && !tvMode);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const SelectedIcon = selected?.icon;

  if (tvMode && tvFocusKeyPrefix) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;
          return (
            <Button
              key={option.value}
              variant={active ? "default" : "secondary"}
              size="lg"
              className="shrink-0 gap-2"
              tv={{
                focusKey: `${tvFocusKeyPrefix}-${option.value}`,
                onPress: () => onValueChange(option.value),
                onFocused: () => onValueChange(option.value),
                accessibilityLabel: typeof option.label === "string" ? option.label : option.value,
                onArrowPress: (direction) => {
                  if (direction !== "down" || !tvGetDownFocusKey) return true;
                  const target = tvGetDownFocusKey(option.value);
                  if (!target) return true;
                  setFocus(target);
                  return false;
                },
              }}
            >
              {Icon ? <Icon className="size-4 shrink-0" /> : null}
              <span className="inline-flex min-w-0 max-w-full items-center font-medium">{option.label}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  if (useSelect) {
    return (
      <DropDrawer>
        <DropDrawerTrigger asChild>
          <Button variant="outline" size="lg" className={cn("w-full justify-between gap-2", className)}>
            <span className="flex min-w-0 items-center gap-2">
              {SelectedIcon ? <SelectedIcon className="size-4 shrink-0 text-foreground" /> : null}
              <span className="truncate font-medium">{selected?.label}</span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropDrawerTrigger>
        <DropDrawerContent>
          <DropDrawerGroup>
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <DropDrawerItem
                  key={option.value}
                  onSelect={() => onValueChange(option.value)}
                  icon={option.value === value ? <CheckIcon className="size-4" /> : undefined}
                >
                  <span className="flex items-center gap-2">
                    {Icon ? <Icon className="size-4" /> : null}
                    {option.label}
                  </span>
                </DropDrawerItem>
              );
            })}
          </DropDrawerGroup>
        </DropDrawerContent>
      </DropDrawer>
    );
  }

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("min-w-0", className)}>
      <TabsList
        size="lg"
        className={cn("overflow-x-auto overscroll-x-contain touch-pan-x justify-start flex-nowrap", listClassName)}
      >
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <TabsTrigger key={option.value} value={option.value} size="lg" className="shrink-0 gap-2">
              {Icon ? <Icon className="size-4" /> : null}
              <span className="font-medium">{option.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
