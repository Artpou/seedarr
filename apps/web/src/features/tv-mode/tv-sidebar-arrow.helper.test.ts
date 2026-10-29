import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tvSidebarVerticalArrow } from "@/features/tv-mode/tv-sidebar-arrow.helper";

vi.mock("@noriginmedia/norigin-spatial-navigation", () => ({
  setFocus: vi.fn(),
}));

const storeState = vi.hoisted(() => ({
  lastContentFocusKey: "CONTENT-1" as string | null,
  pending: false,
}));

vi.mock("@/features/tv-mode/tv-sidebar-store", () => ({
  useTvSidebarStore: {
    getState: () => ({
      lastContentFocusKey: storeState.lastContentFocusKey,
      markPendingContentFocusRestore: () => {
        storeState.pending = true;
      },
    }),
  },
}));

describe("tvSidebarVerticalArrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.lastContentFocusKey = "CONTENT-1";
    storeState.pending = false;
  });
  it("moves focus up and down within the sidebar", () => {
    const handler = tvSidebarVerticalArrow("UP", "DOWN").onArrowPress;
    expect(handler?.("up")).toBe(false);
    expect(setFocus).toHaveBeenCalledWith("UP");
    expect(handler?.("down")).toBe(false);
    expect(setFocus).toHaveBeenCalledWith("DOWN");
  });

  it("blocks left arrow", () => {
    const handler = tvSidebarVerticalArrow(undefined, undefined).onArrowPress;
    expect(handler?.("left")).toBe(false);
    expect(handler?.("right")).toBe(false);
    expect(setFocus).toHaveBeenCalledWith("CONTENT-1");
  });
});
