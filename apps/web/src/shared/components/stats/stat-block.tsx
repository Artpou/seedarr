import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatBlock({
  value,
  label,
  sublabel,
  icon,
  align = "center",
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  sublabel?: ReactNode;
  icon?: ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 px-4 py-2",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-xl font-semibold tracking-tight tabular-nums md:text-2xl">
        {icon}
        {value}
      </span>
      <span className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
      {sublabel && <span className="text-[10px] leading-tight text-muted-foreground">{sublabel}</span>}
    </div>
  );
}
