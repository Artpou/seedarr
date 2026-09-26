import { useEffect, useState } from "react";

import { useLingui } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";

import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { Input } from "@/shared/ui/input";

import { parseSearchRouteType } from "@/routes/helpers/search-route.helper";

export function TopbarSearch() {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.search as Record<string, unknown>;
  const urlQ = typeof searchParams.q === "string" ? searchParams.q : "";
  const type = parseSearchRouteType(searchParams.type);

  const [query, setQuery] = useState(urlQ);
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);

  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (debouncedQuery === urlQ) return;
    navigate({
      to: "/search",
      search: (prev) => ({ ...prev, q: debouncedQuery, type }),
      replace: true,
      resetScroll: false,
    });
  }, [debouncedQuery, navigate, type, urlQ]);

  const placeholder = type === "tv" ? t`Search TV shows...` : t`Search movies...`;

  return (
    <div className="flex min-w-0 flex-1 items-center">
      <Input
        type="search"
        search
        autoFocus
        variant="ghost"
        classNameWrapper="min-w-0 flex-1"
        className="h-10"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
