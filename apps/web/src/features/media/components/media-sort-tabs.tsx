import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { Radio, Star, TrendingUp } from "lucide-react";
import { SortOption } from "tmdb-ts";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const sortOptions = [
  {
    value: "popularity.desc",
    icon: <TrendingUp className="text-foreground" />,
    label: msg`Popular`,
  },
  {
    value: "vote_average.desc",
    icon: <Star className="text-foreground" />,
    label: msg`Top Rated`,
  },
  {
    value: "release_date.desc",
    icon: <Radio className="text-foreground" />,
    label: msg`Upcoming`,
  },
];

interface MediaSortTabsProps {
  value: SortOption;
  onValueChange: (updates: { sort_by: SortOption }) => void;
}

export function MediaSortTabs({ value, onValueChange }: MediaSortTabsProps) {
  const { t } = useLingui();

  return (
    <Tabs
      value={value}
      onValueChange={(sortBy) => onValueChange({ sort_by: sortBy as SortOption })}
    >
      <TabsList className="h-auto p-1">
        {sortOptions.map(({ value, icon, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {icon}
            <span className="font-medium">{t(label)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
