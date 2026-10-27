import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useTvFocusable } from "./use-tv-focusable";

export type TvFocusTarget = {
  focusKey: string;
  onPress: () => void;
  accessibilityLabel?: string;
  enabled?: boolean;
  onFocused?: () => void;
  /** Return `false` to block default spatial navigation for this arrow. */
  onArrowPress?: (direction: string) => boolean;
};

type TvFocusableProps = {
  tv: TvFocusTarget;
  className?: string;
  role?: "button" | "link";
  /** When true, focus ring targets focusable children (e.g. button inside a wrapper). */
  focusRoot?: boolean;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "onClick" | "onKeyDown" | "role" | "children" | "className">;

/** Wraps one interactive region for spatial navigation (no-op when TV mode is off). */
export function TvFocusable({
  tv,
  className,
  role = "button",
  focusRoot = false,
  children,
  ...rest
}: TvFocusableProps) {
  const { tvMode, ref, focused } = useTvFocusable({
    focusKey: tv.focusKey,
    focusable: tv.enabled ?? true,
    onEnterPress: tv.onPress,
    onArrowPress: tv.onArrowPress,
    accessibilityLabel: tv.accessibilityLabel,
    onFocused: tv.onFocused,
  });

  if (!tvMode || !(tv.enabled ?? true)) {
    return children;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: TV spatial-nav shell with explicit role
    <div
      ref={ref}
      role={role}
      tabIndex={-1}
      data-tv-focus-root={focusRoot ? true : undefined}
      data-tv-focused={focused}
      className={cn("outline-none max-w-full", className)}
      onClick={tv.onPress}
      onKeyDown={(event) => {
        if (event.key === "Enter") tv.onPress();
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
