import type { ReactNode } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import type { TvFocusTarget } from "./tv-focusable";
import { TvFocusable } from "./tv-focusable";

type TvRouterLinkProps = {
  tvFocusKey: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
  accessibilityLabel?: string;
  onArrowPress?: TvFocusTarget["onArrowPress"];
  "data-slot"?: string;
} & Omit<React.ComponentProps<"a">, "href" | "children">;

/** Router link that becomes a TV focus target in `?mode=tv`. */
export function TvRouterLink({
  tvFocusKey,
  to,
  params,
  search = {},
  className,
  children,
  accessibilityLabel,
  onArrowPress,
  "data-slot": dataSlot,
}: TvRouterLinkProps) {
  const tvMode = useTvMode();
  const navigate = useNavigate();
  const go = () => navigate({ to, params, search });

  if (!tvMode) {
    return (
      <Link to={to} params={params} search={search} className={className} data-slot={dataSlot}>
        {children}
      </Link>
    );
  }

  return (
    <TvFocusable
      tv={{ focusKey: tvFocusKey, onPress: go, accessibilityLabel, onArrowPress }}
      className={className}
      role="link"
      data-slot={dataSlot}
    >
      {children}
    </TvFocusable>
  );
}
