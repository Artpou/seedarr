import { useMemo } from "react";

import { Trans } from "@lingui/react/macro";
import type { RequestStatus } from "@seedarr/contracts";
import type { MediaRequest } from "@seedarr/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { flattenInfiniteResults } from "@/shared/hooks/use-infinite-list";
import { Container } from "@/shared/ui/container";

import { RequestGrid } from "@/features/request/components/request-grid";
import { RequestTabs } from "@/features/request/components/request-tabs";
import { requestQueries } from "@/features/request/hooks/request.queries";

export interface RequestsViewProps {
  type: "movie" | "tv" | undefined;
  status: RequestStatus | undefined;
  q?: string;
}

export function RequestsView({ type, status, q }: RequestsViewProps) {
  const navigate = useNavigate();

  const query = useInfiniteQuery(requestQueries.list({ type, status }));
  const results = flattenInfiniteResults(query);

  const filtered = useMemo(() => {
    const needle = q?.trim().toLowerCase();
    if (!needle) return results;
    return results.filter((item: MediaRequest) => item.media.title.toLowerCase().includes(needle));
  }, [q, results]);

  return (
    <Container>
      <div className="space-y-6">
        <RequestTabs
          status={status}
          type={type}
          onStatusChange={(next) => navigate({ to: "/requests", search: { type, status: next, q } })}
          onTypeChange={(next) => navigate({ to: "/requests", search: { status, type: next, q } })}
        />

        {!query.isPending && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">
              <Trans>No requests found.</Trans>
            </p>
          </div>
        ) : (
          <RequestGrid items={filtered} query={q?.trim() ? undefined : query} isLoading={query.isPending} />
        )}
      </div>
    </Container>
  );
}
