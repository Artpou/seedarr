import { useRef } from "react";

import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";

import { Input } from "@/shared/ui/input";

import type { SearchRouteType } from "@/routes/helpers/search-route.helper";

type TopbarDiscoverSearchInputProps = {
  mediaType: SearchRouteType;
};

export function TopbarDiscoverSearchInput({ mediaType }: TopbarDiscoverSearchInputProps) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholder = mediaType === "tv" ? t`Search TV shows...` : t`Search movies...`;

  const goToSearch = () => {
    navigate({ to: "/search", search: { q: "", type: mediaType } });
  };

  return (
    <div className="flex min-w-0 flex-1 items-center">
      <Input
        ref={inputRef}
        type="search"
        search
        readOnly
        variant="ghost"
        classNameWrapper="min-w-0 flex-1"
        className="h-10 cursor-text"
        placeholder={placeholder}
        value=""
        onFocus={(e) => {
          e.target.blur();
          goToSearch();
        }}
        onClick={goToSearch}
        aria-label={placeholder}
      />
    </div>
  );
}
