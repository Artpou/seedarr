import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { Calendar, Radio, Star, TrendingUp } from "lucide-react";
import { SortOption } from "tmdb-ts";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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
    value: "primary_release_date.desc",
    icon: <Calendar className="text-foreground" />,
    label: msg`Latest`,
  },
  {
    value: "release_date.desc",
    icon: <Radio className="text-foreground" />,
    label: msg`Upcoming`,
  },
];

interface MediaListDropdownProps {
  value: SortOption;
  onValueChange: (updates: { sort_by: SortOption }) => void;
}

export function MediaListDropdown({ value, onValueChange }: MediaListDropdownProps) {
  const { t } = useLingui();

  return (
    <Select
      value={value}
      onValueChange={(sortBy) => onValueChange({ sort_by: sortBy as SortOption })}
    >
      <SelectTrigger className="w-[240px] text-lg">
        <div className="flex items-center gap-2">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map(({ value, icon, label }) => (
          <SelectItem key={value} value={value} className="text-base">
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-bold">
                <span>{t(label)}</span>
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
