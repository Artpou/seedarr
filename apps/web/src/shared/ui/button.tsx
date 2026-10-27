import { Children, cloneElement, forwardRef, isValidElement, type ReactElement } from "react";

import { Slot } from "@radix-ui/react-slot";
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { controlSurfaceFocusClass } from "@/shared/ui/control-surface";
import { TooltipWrapper } from "@/shared/ui/tooltip-wrapper";
import type { TvFocusTarget } from "@/shared/ui/tv/tv-focusable";
import { useTvFocusable } from "@/shared/ui/tv/use-tv-focusable";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border border-border bg-input text-foreground shadow-none hover:border-primary/25 hover:bg-primary/15",
        outline:
          "border border-border bg-input text-foreground shadow-none hover:border-primary/25 hover:bg-primary/15",
        input: "border border-border bg-input text-foreground shadow-none hover:border-primary/25 hover:bg-primary/15",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8",
        "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-xl": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    to?: React.ComponentProps<typeof Link>["to"];
    tooltip?: React.ReactNode;
    rounded?: boolean;
    /** Lucide icon rendered before children; size follows the button size variant via CSS. */
    icon?: LucideIcon;
    /** When true, shows a spinner and disables the button. */
    loading?: boolean;
    /** Spatial-navigation target when `?mode=tv` is active. */
    tv?: TvFocusTarget;
  };

function renderIcon(Icon: LucideIcon | undefined, loading: boolean) {
  if (loading) return <Loader2Icon className="animate-spin" />;
  if (Icon) return <Icon />;
  return null;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    children,
    to,
    tooltip,
    rounded = false,
    icon: Icon,
    loading = false,
    disabled,
    tv,
    onKeyDown,
    ...props
  },
  forwardedRef,
) {
  const tvMode = useTvMode();
  const tvActive = Boolean(tvMode && tv && (tv.enabled ?? true));
  const {
    ref: tvRef,
    focused: tvFocused,
    tvClassName,
  } = useTvFocusable({
    focusKey: tv?.focusKey ?? "BUTTON-NOOP",
    focusable: tvActive,
    onEnterPress: tv?.onPress,
    accessibilityLabel: tv?.accessibilityLabel,
  });

  const setRef = (node: HTMLButtonElement | null) => {
    tvRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;
  const chromeFocus =
    variant === "secondary" || variant === "outline" || variant === "input" ? controlSurfaceFocusClass : "";

  const classNames = cn(
    buttonVariants({ variant, size, className }),
    chromeFocus,
    rounded && "rounded-full",
    tvActive && tvClassName,
  );

  let body: React.ReactNode;

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) {
      throw new Error("Button asChild expects a single React element child");
    }
    const element = child as ReactElement<{ children?: React.ReactNode }>;
    body = cloneElement(
      element,
      undefined,
      <>
        {renderIcon(Icon, loading)}
        {element.props.children}
      </>,
    );
  } else if (to) {
    body = (
      <Link to={to}>
        {renderIcon(Icon, loading)}
        {children}
      </Link>
    );
  } else {
    body = (
      <>
        {renderIcon(Icon, loading)}
        {children}
      </>
    );
  }

  const button = (
    <Comp
      ref={asChild ? undefined : setRef}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-tv-focused={tvActive ? tvFocused : undefined}
      className={classNames}
      disabled={asChild ? undefined : isDisabled}
      aria-disabled={asChild && isDisabled ? true : undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (tvActive && event.key === "Enter") tv?.onPress();
      }}
      {...props}
    >
      {body}
    </Comp>
  );

  return <TooltipWrapper tooltip={tvActive ? undefined : tooltip}>{button}</TooltipWrapper>;
});

export { Button, buttonVariants };
