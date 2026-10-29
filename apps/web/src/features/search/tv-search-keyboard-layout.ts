import { tvSearchKeyFocusKey } from "@/features/tv-mode/tv-focus-keys";

export const TV_SEARCH_KEYBOARD_LETTERS_PER_ROW = 6;

export type TvSearchKeyToken = "backspace" | "space" | "clear" | (string & {});

export type TvSearchKeyboardRow = {
  keys: { id: TvSearchKeyToken }[];
  /** Action row (delete / space / clear). */
  isActionRow?: boolean;
};

function alphabetRows(): TvSearchKeyboardRow[] {
  const keys = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
  const rows: TvSearchKeyboardRow[] = [];
  for (let i = 0; i < keys.length; i += TV_SEARCH_KEYBOARD_LETTERS_PER_ROW) {
    rows.push({
      keys: keys.slice(i, i + TV_SEARCH_KEYBOARD_LETTERS_PER_ROW).map((id) => ({ id })),
    });
  }
  return rows;
}

export function getTvSearchKeyboardRows(): TvSearchKeyboardRow[] {
  return [
    ...alphabetRows(),
    {
      isActionRow: true,
      keys: [{ id: "backspace" }, { id: "space" }, { id: "clear" }],
    },
  ];
}

export function tvSearchKeyboardFocusKey(rowIndex: number, keyIndex: number, id: TvSearchKeyToken): string {
  return tvSearchKeyFocusKey(`${id}-${rowIndex}-${keyIndex}`);
}

export function getTvSearchKeyboardInitialFocusKey(): string {
  const rows = getTvSearchKeyboardRows();
  const first = rows[0]?.keys[0];
  if (first) return tvSearchKeyboardFocusKey(0, 0, first.id);
  return tvSearchKeyboardFocusKey(0, 0, "a");
}
