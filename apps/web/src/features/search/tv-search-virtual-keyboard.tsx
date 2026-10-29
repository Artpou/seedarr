import type { ReactNode } from "react";

import { Trans } from "@lingui/react/macro";
import { DeleteIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

import { TvSearchFocusPanel } from "./tv-search-focus-panel";
import {
  getTvSearchKeyboardRows,
  TV_SEARCH_KEYBOARD_LETTERS_PER_ROW,
  type TvSearchKeyToken,
  tvSearchKeyboardFocusKey,
} from "./tv-search-keyboard-layout";

type TvSearchVirtualKeyboardProps = {
  onCharacter: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClear: () => void;
  className?: string;
};

function keyMeta(id: TvSearchKeyToken): { label: ReactNode; a11y: string } {
  if (id === "space") {
    return {
      label: <span className="text-xs font-medium tracking-wide text-muted-foreground">Space</span>,
      a11y: "Space",
    };
  }
  if (id === "backspace") return { label: <DeleteIcon className="size-5" />, a11y: "Backspace" };
  if (id === "clear") return { label: <Trans>Clear</Trans>, a11y: "Clear" };
  if (id.length === 1) return { label: id.toUpperCase(), a11y: id.toUpperCase() };
  return { label: null, a11y: id };
}

export function TvSearchVirtualKeyboard({
  onCharacter,
  onBackspace,
  onSpace,
  onClear,
  className,
}: TvSearchVirtualKeyboardProps) {
  const rows = getTvSearchKeyboardRows();

  const pressKey = (id: TvSearchKeyToken) => {
    if (id === "space") onSpace();
    else if (id === "backspace") onBackspace();
    else if (id === "clear") onClear();
    else if (id.length === 1) onCharacter(id);
  };

  return (
    <TvSearchFocusPanel className={cn("min-h-0 flex-1", className)}>
      <div className="flex flex-col gap-1.5 rounded-xl border border-border/80 bg-input/25 p-2">
        {rows.map((row, rowIndex) => {
          const rowKey = row.keys.map((key) => key.id).join("-");
          const columns = row.isActionRow ? row.keys.length : TV_SEARCH_KEYBOARD_LETTERS_PER_ROW;
          return (
            <div
              key={rowKey}
              className="grid w-full gap-1.5"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {row.keys.map((key, keyIndex) => {
                const { label, a11y } = keyMeta(key.id);
                return (
                  <Button
                    key={tvSearchKeyboardFocusKey(rowIndex, keyIndex, key.id)}
                    type="button"
                    variant="secondary"
                    className="h-11 min-h-11 min-w-0 rounded-md px-0 text-sm font-semibold shadow-sm"
                    tv={{
                      focusKey: tvSearchKeyboardFocusKey(rowIndex, keyIndex, key.id),
                      onPress: () => pressKey(key.id),
                      accessibilityLabel: a11y,
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          );
        })}
      </div>
    </TvSearchFocusPanel>
  );
}
