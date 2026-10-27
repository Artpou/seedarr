import { describe, expect, it } from "vitest";

import { getTopbarMode } from "@/shared/components/topbar/topbar-route.helper";

describe("getTopbarMode", () => {
  it("matches list routes", () => {
    expect(getTopbarMode("/movies", "u1")).toBe("movies");
    expect(getTopbarMode("/movies", "u1", { type: "popular" })).toBe("movies-scoped");
    expect(getTopbarMode("/tv", "u1")).toBe("tv");
    expect(getTopbarMode("/tv", "u1", { genre: "28" })).toBe("tv-scoped");
    expect(getTopbarMode("/downloads", "u1")).toBe("downloads");
    expect(getTopbarMode("/requests", "u1")).toBe("requests");
    expect(getTopbarMode("/settings/general", "u1")).toBe("settings");
    expect(getTopbarMode("/settings/modules", "u1")).toBe("settings");
    expect(getTopbarMode("/settings/modules/abc", "u1")).toBe("default");
  });

  it("matches own profile only", () => {
    expect(getTopbarMode("/user/u1", "u1")).toBe("profile");
    expect(getTopbarMode("/user/u2", "u1")).toBe("default");
    expect(getTopbarMode("/user/u1/likes", "u1")).toBe("profile");
    expect(getTopbarMode("/user/u1/watch-list", "u1")).toBe("profile");
    expect(getTopbarMode("/user/u1/history", "u1")).toBe("profile");
    expect(getTopbarMode("/user/u1/requests", "u1")).toBe("default");
  });

  it("defaults for detail routes", () => {
    expect(getTopbarMode("/movies/123", "u1")).toBe("default");
    expect(getTopbarMode("/search", "u1")).toBe("search");
    expect(getTopbarMode("/person/1", "u1")).toBe("default");
  });
});
