import { describe, expect, it } from "vitest";

import { interceptTvBack, pushTvBackIntercept } from "@/features/tv-mode/tv-back-intercept";

describe("tv-back-intercept", () => {
  it("calls the most recently registered handler", () => {
    const calls: string[] = [];
    pushTvBackIntercept(() => calls.push("a"));
    const removeB = pushTvBackIntercept(() => calls.push("b"));

    expect(interceptTvBack()).toBe(true);
    expect(calls).toEqual(["b"]);

    removeB();
    expect(interceptTvBack()).toBe(true);
    expect(calls).toEqual(["b", "a"]);
  });
});
