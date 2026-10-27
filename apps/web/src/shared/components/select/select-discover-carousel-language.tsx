import { Trans, useLingui } from "@lingui/react/macro";

import { Select } from "@/shared/components/select/select";
import {
  TMDB_ORIGINAL_LANGUAGE_CODES,
  tmdbOriginalLanguageLabel,
} from "@/shared/helpers/tmdb-original-language.helper";

interface SelectDiscoverCarouselLanguageProps {
  value: string | null;
  onValueChange: (code: string | null) => void;
  triggerClassName?: string;
}

export function SelectDiscoverCarouselLanguage({
  value,
  onValueChange,
  triggerClassName,
}: SelectDiscoverCarouselLanguageProps) {
  const { i18n } = useLingui();
  const locale = i18n.locale;

  return (
    <Select
      value={value ?? "none"}
      onValueChange={(next) => onValueChange(next === "none" ? null : next)}
      options={[
        { value: "none", label: <Trans>None</Trans> },
        ...TMDB_ORIGINAL_LANGUAGE_CODES.map((code) => ({
          value: code,
          label: tmdbOriginalLanguageLabel(code, locale),
        })),
      ]}
      triggerClassName={triggerClassName}
    />
  );
}
