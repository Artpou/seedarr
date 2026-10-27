import { useEffect, useState } from "react";

import { useDebounce } from "@uidotdev/usehooks";

import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";

/** Local search input synced to the URL after debounce (topbar). */
export function useTopbarDebouncedQuery(urlQ: string, enabled: boolean, onDebounced: (value: string) => void) {
  const [query, setQuery] = useState(urlQ);
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);

  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (!enabled) return;
    onDebounced(debouncedQuery);
  }, [debouncedQuery, enabled, onDebounced]);

  return { query, setQuery };
}
