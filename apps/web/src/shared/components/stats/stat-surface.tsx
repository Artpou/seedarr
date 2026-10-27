import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const surfaceClass =
  "rounded-2xl border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm ring-1 ring-inset ring-border/40";

export function StatSurface({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(surfaceClass, className)}>{children}</div>;
}

export function StatSurfaceGlow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden", surfaceClass, className)}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.07]"
        aria-hidden
      />
      {children}
    </div>
  );
}
