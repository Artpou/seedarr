import type { ReactNode } from "react";

/** TV main column wrapper (sidebar layout — no top search bar). */
export function TvMainChrome({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>;
}
