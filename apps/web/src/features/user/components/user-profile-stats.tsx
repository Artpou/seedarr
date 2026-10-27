import { Trans } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClapperboardIcon, TvIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatBlock } from "@/shared/components/stats/stat-block";
import { StatSurface } from "@/shared/components/stats/stat-surface";
import { useIsMobile } from "@/shared/hooks/use-mobile";

import { userQueries } from "@/features/user/hooks/user.queries";

interface UserProfileStatsProps {
  userId: string;
  className?: string;
}

const statCellClass = "flex min-w-[5.5rem] flex-1 justify-center px-4 py-1 sm:min-w-[6.25rem] sm:px-5";

export function UserProfileStats({ userId, className }: UserProfileStatsProps) {
  const isMobile = useIsMobile();
  const { data } = useSuspenseQuery(userQueries.stats(userId));

  const blocks = [
    ...(!isMobile
      ? [
          {
            key: "movies-year",
            value: data.movies.thisYear,
            label: <Trans>Movies</Trans>,
            sublabel: <Trans>this year</Trans>,
            icon: <ClapperboardIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />,
          },
        ]
      : []),
    {
      key: "movies-all",
      value: data.movies.allTime,
      label: <Trans>Movies</Trans>,
      sublabel: <Trans>all time</Trans>,
      icon: isMobile ? <ClapperboardIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : undefined,
    },
    ...(!isMobile
      ? [
          {
            key: "tv-year",
            value: data.tv.thisYear,
            label: <Trans>TV</Trans>,
            sublabel: <Trans>this year</Trans>,
            icon: <TvIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />,
          },
        ]
      : []),
    {
      key: "tv-all",
      value: data.tv.allTime,
      label: <Trans>TV</Trans>,
      sublabel: <Trans>all time</Trans>,
      icon: isMobile ? <TvIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : undefined,
    },
  ].filter((block) => block.value > 0);

  if (blocks.length === 0) return null;

  return (
    <StatSurface
      className={cn(
        "flex w-full min-h-[5rem] items-center justify-center px-2 py-3 sm:px-3 lg:ml-auto lg:max-w-2xl lg:flex-1",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-xl flex-row flex-wrap items-center justify-center sm:flex-nowrap">
        {blocks.map((block, index) => (
          <StatBlock
            key={block.key}
            value={block.value}
            label={block.label}
            sublabel={block.sublabel}
            icon={block.icon}
            className={cn(statCellClass, index < blocks.length - 1 && "border-r")}
          />
        ))}
      </div>
    </StatSurface>
  );
}
