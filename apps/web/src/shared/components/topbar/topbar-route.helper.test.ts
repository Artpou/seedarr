import { describe, expect, it } from "vitest";

import { getMobileTopbarMode } from "@/shared/components/topbar/topbar-route.helper";

describe("getMobileTopbarMode", () => {
  it("matches list routes", () => {
    expect(getMobileTopbarMode("/movies", "u1")).toBe("movies");
    expect(getMobileTopbarMode("/movies", "u1", { type: "new" })).toBe("movies-scoped");
    expect(getMobileTopbarMode("/tv", "u1")).toBe("tv");
    expect(getMobileTopbarMode("/tv", "u1", { genre: "28" })).toBe("tv-scoped");
    expect(getMobileTopbarMode("/downloads", "u1")).toBe("downloads");
    expect(getMobileTopbarMode("/requests", "u1")).toBe("requests");
    expect(getMobileTopbarMode("/settings/general", "u1")).toBe("settings");
    expect(getMobileTopbarMode("/settings/modules", "u1")).toBe("settings");
    expect(getMobileTopbarMode("/settings/modules/abc", "u1")).toBe("default");
  });

  it("matches own profile only", () => {
    expect(getMobileTopbarMode("/user/u1", "u1")).toBe("profile");
    expect(getMobileTopbarMode("/user/u2", "u1")).toBe("default");
    expect(getMobileTopbarMode("/user/u1/likes", "u1")).toBe("profile");
    expect(getMobileTopbarMode("/user/u1/watch-list", "u1")).toBe("profile");
    expect(getMobileTopbarMode("/user/u1/history", "u1")).toBe("profile");
    expect(getMobileTopbarMode("/user/u1/requests", "u1")).toBe("default");
  });

  it("defaults for detail routes", () => {
    expect(getMobileTopbarMode("/movies/123", "u1")).toBe("default");
    expect(getMobileTopbarMode("/search", "u1")).toBe("search");
    expect(getMobileTopbarMode("/person/1", "u1")).toBe("default");
  });
});
