import { useEffect, useState } from "react";

import { useDebounce } from "@uidotdev/usehooks";

import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { Input } from "@/shared/ui/input";

interface TopbarSearchFieldProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  classNameWrapper?: string;
}

export function TopbarSearchField({ value, onChange, placeholder, classNameWrapper }: TopbarSearchFieldProps) {
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

  return (
    <Input
      type="search"
      search
      variant="ghost"
      classNameWrapper={classNameWrapper ?? "min-w-0 flex-1"}
      className="h-10"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
