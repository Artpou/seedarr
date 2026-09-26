import { Trans } from "@lingui/react/macro";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import type { ButtonProps } from "@/shared/ui/button";

import { type MediaFiltersValue, MediaSheetFilter } from "@/features/media/components/sheet/media-sheet-filter";

export interface MovieFiltersValue {
  release_date_gte?: string;
  release_date_lte?: string;
  with_genres?: string;
  with_watch_providers?: string;
  with_keywords?: string;
  with_keywords_label?: string;
  with_runtime_gte?: number;
  with_runtime_lte?: number;
  vote_average_gte?: number;
}

interface MovieFiltersSheetProps {
  value: MovieFiltersValue;
  onChange: (value: MovieFiltersValue) => void;
  triggerVariant?: ButtonProps["variant"];
}

function toGeneric(value: MovieFiltersValue): MediaFiltersValue {
  return {
    ...value,
    date_gte: value.release_date_gte,
    date_lte: value.release_date_lte,
  };
}

function fromGeneric(value: MediaFiltersValue): MovieFiltersValue {
  return {
    release_date_gte: value.date_gte,
    release_date_lte: value.date_lte,
    with_watch_providers: value.with_watch_providers,
    with_keywords: value.with_keywords,
    with_keywords_label: value.with_keywords_label,
    with_runtime_gte: value.with_runtime_gte,
    with_runtime_lte: value.with_runtime_lte,
    vote_average_gte: value.vote_average_gte,
  };
}

export function MovieFiltersSheet({ value, onChange, triggerVariant }: MovieFiltersSheetProps) {
  const isMobile = useIsMobile();
  return (
    <MediaSheetFilter
      mode="discover"
      genreScope="movie"
      categoryValueMode="id"
      type="movie"
      hideCategories
      value={toGeneric(value)}
      onChange={(v) => onChange(fromGeneric(v))}
      runtimeLabel={<Trans>Runtime (minutes)</Trans>}
      description={isMobile ? undefined : <Trans>Refine the list of movies by combining several criteria.</Trans>}
      dateInputIdPrefix="release-date"
      triggerVariant={triggerVariant}
    />
  );
}
