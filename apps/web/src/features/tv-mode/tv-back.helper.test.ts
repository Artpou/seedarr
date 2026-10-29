import { describe, expect, it } from "vitest";

import {
  isTvBackKey,
  isTvFocusInTopbar,
  isTvTopbarBackRoot,
  resolveTvTopbarBackFocusKey,
} from "@/features/tv-mode/tv-back.helper";

describe("tv-back.helper", () => {
  it("detects TV back keys", () => {
    expect(isTvBackKey("BrowserBack")).toBe(true);
    expect(isTvBackKey("Enter")).toBe(false);
  });

  it("detects topbar-back roots only", () => {
    expect(isTvTopbarBackRoot("/movies")).toBe(true);
    expect(isTvTopbarBackRoot("/tv/")).toBe(true);
    expect(isTvTopbarBackRoot("/downloads")).toBe(true);
    expect(isTvTopbarBackRoot("/downloads/")).toBe(true);
    expect(isTvTopbarBackRoot("/user/abc")).toBe(true);
    expect(isTvTopbarBackRoot("/user/abc/")).toBe(true);

    expect(isTvTopbarBackRoot("/movies/123")).toBe(false);
    expect(isTvTopbarBackRoot("/search")).toBe(false);
    expect(isTvTopbarBackRoot("/user/abc/likes")).toBe(false);
  });

  it("resolves nav focus keys on topbar-back roots", () => {
    expect(resolveTvTopbarBackFocusKey("/movies")).toBe("NAV-/movies");
    expect(resolveTvTopbarBackFocusKey("/tv")).toBe("NAV-/tv");
    expect(resolveTvTopbarBackFocusKey("/downloads")).toBe("NAV-/downloads");
    expect(resolveTvTopbarBackFocusKey("/user/42")).toBe("NAV-/user/$id-42");
    expect(resolveTvTopbarBackFocusKey("/settings")).toBe("NAV-/settings");
    expect(resolveTvTopbarBackFocusKey("/movies/123")).toBeNull();
  });

  it("detects sidebar focus via data-tv-focused", () => {
    const doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = `
      <aside data-slot="tv-sidebar"><a data-tv-focused="true">Movies</a></aside>
      <main><div data-tv-focused="true">Card</div></main>
    `;
    expect(isTvFocusInTopbar(doc)).toBe(true);

    doc.body.innerHTML = `
      <aside data-slot="tv-sidebar"><a>Movies</a></aside>
      <main><div data-tv-focused="true">Card</div></main>
    `;
    expect(isTvFocusInTopbar(doc)).toBe(false);
  });
});
