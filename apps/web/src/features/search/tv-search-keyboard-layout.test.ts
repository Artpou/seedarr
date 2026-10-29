import { describe, expect, it } from "vitest";

import {
  getTvSearchKeyboardRows,
  TV_SEARCH_KEYBOARD_LETTERS_PER_ROW,
} from "@/features/search/tv-search-keyboard-layout";

describe("tv-search-keyboard-layout", () => {
  it("lays out a–z then 0–9 in order, 6 keys per row", () => {
    const rows = getTvSearchKeyboardRows();
    const letterRows = rows.filter((row) => !row.isActionRow);
    expect(letterRows).toHaveLength(6);
    expect(letterRows.every((row) => row.keys.length === TV_SEARCH_KEYBOARD_LETTERS_PER_ROW)).toBe(true);
    const chars = letterRows.flatMap((row) => row.keys.map((key) => key.id)).join("");
    expect(chars).toBe("abcdefghijklmnopqrstuvwxyz0123456789");
  });

  it("ends with delete, space, clear", () => {
    const rows = getTvSearchKeyboardRows();
    const action = rows.at(-1);
    expect(action?.isActionRow).toBe(true);
    expect(action?.keys.map((key) => key.id)).toEqual(["backspace", "space", "clear"]);
  });
});
