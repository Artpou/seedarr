import { useEffect, useId, useState } from "react";

import { useDebounce } from "@uidotdev/usehooks";

import { cn } from "@/lib/utils";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { Input } from "@/shared/ui/input";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

interface TopbarSearchFieldProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  classNameWrapper?: string;
  /** Spatial-nav focus key when `?mode=tv` (input stays editable). */
  tvFocusKey?: string;
  tvAccessibilityLabel?: string;
}

export function TopbarSearchField({
  value,
  onChange,
  placeholder,
  classNameWrapper,
  tvFocusKey,
  tvAccessibilityLabel,
}: TopbarSearchFieldProps) {
  const tvMode = useTvMode();
  const inputId = useId();
  const [query, setQuery] = useState(value ?? "");
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    const next = debouncedQuery.trim() || undefined;
    if ((value ?? undefined) === next) return;
    onChange(next);
  }, [debouncedQuery, onChange, value]);

  const wrapperClass = classNameWrapper ?? "min-w-0 flex-1";
  const focusInput = () => document.getElementById(inputId)?.focus();

  const field = (
    <Input
      id={inputId}
      type="search"
      search
      variant="ghost"
      classNameWrapper={wrapperClass}
      className="rounded-full"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      aria-label={tvAccessibilityLabel ?? placeholder}
    />
  );

  if (!tvMode || !tvFocusKey) {
    return field;
  }

  return (
    <TvFocusable
      focusRoot
      tv={{
        focusKey: tvFocusKey,
        onPress: focusInput,
        accessibilityLabel: tvAccessibilityLabel ?? placeholder,
      }}
      className={cn(wrapperClass, "rounded-full")}
    >
      {field}
    </TvFocusable>
  );
}
