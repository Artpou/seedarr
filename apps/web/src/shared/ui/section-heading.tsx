import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type IconBadgeProps = {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
};

export function IconBadge({ icon: Icon, className, iconClassName }: IconBadgeProps) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary",
        className,
      )}
    >
      <Icon className={cn("size-4", iconClassName)} aria-hidden />
    </span>
  );
}

type SectionHeadingProps = {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

export function SectionHeading({ icon, children, className }: SectionHeadingProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <IconBadge icon={icon} />
      <span className="truncate">{children}</span>
    </span>
  );
}
