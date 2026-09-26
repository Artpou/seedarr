import type { RequestStatus } from "@seedarr/contracts";
import { parseString } from "@seedarr/shared";

export type RequestsRouteSearch = {
  type?: "movie" | "tv";
  status?: RequestStatus;
  q?: string;
};

export function validateRequestsSearch(search: Record<string, unknown>): RequestsRouteSearch {
  const type = search.type;
  const status = search.status;
  const q = parseString(search.q);
  return {
    ...(type === "movie" || type === "tv" ? { type } : {}),
    ...(status === "pending" || status === "validated" || status === "cancelled" ? { status } : {}),
    ...(q !== undefined ? { q } : {}),
  };
}
