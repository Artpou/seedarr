import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type TvSearchFocusPanelProps = {
  className?: string;
  children: ReactNode;
};

/** Layout wrapper only — spatial nav stays under the app root (no nested focus boundaries). */
export function TvSearchFocusPanel({ className, children }: TvSearchFocusPanelProps) {
  return <div className={cn(className, "outline-none")}>{children}</div>;
}
