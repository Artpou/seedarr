import { Fragment } from "react";

import { Trans } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";

import { StatBlock, StatDivider } from "@/shared/components/stats/stat-block";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Card } from "@/shared/ui/card";

import { userQueries } from "@/features/user/hooks/user.queries";

interface UserProfileStatsProps {
  userId: string;
}

export function UserProfileStats({ userId }: UserProfileStatsProps) {
  const isMobile = useIsMobile();
  const { data } = useSuspenseQuery(userQueries.stats(userId));

  const blocks = [
    ...(!isMobile
      ? [{ value: data.movies.thisYear, label: <Trans>Movies</Trans>, sublabel: <Trans>this year</Trans> }]
      : []),
    { value: data.movies.allTime, label: <Trans>Movies</Trans>, sublabel: <Trans>all time</Trans> },
    ...(!isMobile ? [{ value: data.tv.thisYear, label: <Trans>TV</Trans>, sublabel: <Trans>this year</Trans> }] : []),
    { value: data.tv.allTime, label: <Trans>TV</Trans>, sublabel: <Trans>all time</Trans> },
  ].filter((block) => block.value > 0);

  if (blocks.length === 0) return null;

  return (
    <Card className="flex w-full flex-row gap-3 px-6 py-2">
      {blocks.map((block, index) => (
        <Fragment key={`${block.value}-${index}`}>
          {index > 0 && <StatDivider />}
          <StatBlock value={block.value} label={block.label} sublabel={block.sublabel} />
        </Fragment>
      ))}
    </Card>
  );
}
