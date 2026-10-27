import type * as React from "react";
import { useState } from "react";

import { EyeIcon, EyeOffIcon, SearchIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  controlFillClass,
  controlSurfaceFocusClass,
  controlSurfaceHoverClass,
  topbarControlHeightClass,
} from "@/shared/ui/control-surface";
import { LabelWrapper } from "@/shared/ui/label";

interface InputProps extends React.ComponentProps<"input"> {
  label?: React.ReactNode;
  classNameWrapper?: string;
  h?: "default" | "lg";
  search?: boolean;
  /** Password field with reveal toggle (overrides type="password"). */
  password?: boolean;
  variant?: "default" | "ghost";
}

const inputChromeClass = cn(controlFillClass, "rounded-full", controlSurfaceHoverClass, controlSurfaceFocusClass);

const inputTopbarChromeClass = cn(
  topbarControlHeightClass,
  "rounded-full border border-border bg-transparent py-1 shadow-none",
  "hover:bg-muted/25",
  controlSurfaceFocusClass,
);

function Input({
  className,
  classNameWrapper,
  type,
  label,
  h,
  search,
  password,
  variant = "default",
  ...props
}: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const inputType = password ? (revealed ? "text" : "password") : type;
  const stringValue = typeof props.value === "string" ? props.value : undefined;
  const showSearchClear = Boolean(search && stringValue && stringValue.length > 0 && !props.readOnly);

  const clearSearch = () => {
    props.onChange?.({ target: { value: "" }, currentTarget: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
  };

  const input = (
    <input
      type={inputType}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/80 selection:bg-primary selection:text-primary-foreground w-full min-w-0 px-3 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        variant === "ghost"
          ? inputTopbarChromeClass
          : cn(inputChromeClass, h === "lg" ? "h-10 min-h-10 py-2" : "h-9 py-5.5 sm:py-1"),
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        !!label && "rounded-tl-none",
        search && "pl-12",
        password && (h === "lg" ? "pr-12" : "pr-10"),
        showSearchClear && "pr-10",
        className,
      )}
      {...props}
    />
  );

  const field = password ? (
    <div className="relative w-full">
      {input}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        rounded
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-card hover:text-foreground",
          h === "lg" ? "right-1.5" : "right-1",
        )}
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? "Hide" : "Show"}
        icon={revealed ? EyeOffIcon : EyeIcon}
      />
    </div>
  ) : (
    input
  );

  const content = search ? (
    <div className="relative w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/80" />
      {field}
      {showSearchClear && (
        <button
          type="button"
          className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <XIcon className="size-4 shrink-0" aria-hidden />
        </button>
      )}
    </div>
  ) : (
    field
  );

  return (
    <LabelWrapper label={label} htmlFor={props.id} className={cn(classNameWrapper, label && "gap-1")}>
      {content}
    </LabelWrapper>
  );
}

export { Input };
