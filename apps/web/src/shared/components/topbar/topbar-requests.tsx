import { useMemo } from "react";

import { useLingui } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { TopbarSearchField } from "@/shared/components/topbar/topbar-search-field";

import { validateRequestsSearch } from "@/routes/helpers/requests-route.helper";

export function TopbarRequests() {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const search = useMemo(() => validateRequestsSearch(location.search as Record<string, unknown>), [location.search]);

  return (
    <TopbarSearchField
      value={search.q}
      onChange={(q) =>
        navigate({
          to: "/requests",
          search: { ...search, q },
          resetScroll: false,
        })
      }
      placeholder={t`Search a request...`}
    />
  );
}
