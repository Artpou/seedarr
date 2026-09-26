import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

interface DiscoverSectionLabelProps {
  icon: LucideIcon;
  children: ReactNode;
}

/** Matches carousel section titles (e.g. Resume watching). */
export function DiscoverSectionLabel({ icon: Icon, children }: DiscoverSectionLabelProps) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-lg">
      <Icon className="size-5 shrink-0" />
      <span className="flex font-medium flex-wrap items-center gap-1.5">{children}</span>
    </span>
  );
}
