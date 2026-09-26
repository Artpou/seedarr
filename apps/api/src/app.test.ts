import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth/auth.route", () => ({ authRoutes: new Hono() }));
vi.mock("@/modules/user/user.route", () => ({ userRoutes: new Hono() }));
vi.mock("@/modules/module/module.route", () => ({ moduleRoutes: new Hono() }));
vi.mock("@/modules/media/media.route", () => ({ mediaRoutes: new Hono() }));
vi.mock("@/modules/movie/movie.route", () => ({ movieRoutes: new Hono() }));
vi.mock("@/modules/person/person.route", () => ({ personRoutes: new Hono() }));
vi.mock("@/modules/tv/tv.route", () => ({ tvRoutes: new Hono() }));
vi.mock("@/modules/torrent/torrent.route", () => ({ torrentRoutes: new Hono() }));
vi.mock("@/modules/download/download.route", () => ({ downloadRoutes: new Hono() }));
vi.mock("@/modules/download/local/local-file.route", () => ({ localFileRoutes: new Hono() }));
vi.mock("@/modules/streaming/streaming.route", () => ({ streamingRoutes: new Hono() }));
vi.mock("@/modules/subtitle/subtitle.route", () => ({ subtitleRoutes: new Hono() }));
vi.mock("@/modules/activity/activity.route", () => ({ activityRoutes: new Hono() }));
vi.mock("@/modules/request/request.route", () => ({ requestRoutes: new Hono() }));
vi.mock("@/modules/user/user.service", () => ({
  UserService: class {
    resolveAvatarFile = vi.fn().mockResolvedValue(null);
  },
}));
vi.mock("@/modules/auth/auth.guard", () => ({
  authGuard: async (_c: unknown, next: () => Promise<void>) => next(),
}));

describe("app bootstrap", () => {
  beforeAll(() => {
    process.env.WEB_URL ??= "http://localhost:3000";
  });

  it("exposes health and version endpoints", async () => {
    const { app } = await import("@/app");

    const health = await app.request("/health");
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toMatchObject({ status: "healthy" });

    const version = await app.request("/version");
    expect(version.status).toBe(200);
    await expect(version.json()).resolves.toMatchObject({
      version: expect.any(String),
      channel: expect.any(String),
    });
  });

  it("returns 404 for unknown avatar", async () => {
    const { app } = await import("@/app");
    expect((await app.request("/avatars/missing-user")).status).toBe(404);
  });

  it("handles CORS preflight OPTIONS requests without CSRF 403", async () => {
    const { app } = await import("@/app");
    const res = await app.request("/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
  });

  it("allows requests from WEB_URL through CSRF middleware", async () => {
    const { app } = await import("@/app");
    const res = await app.request("/health", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    // Not 403 Forbidden
    expect(res.status).not.toBe(403);
  });

  it("rejects untrusted cross-origin requests with CSRF 403", async () => {
    const { app } = await import("@/app");
    const res = await app.request("/health", {
      method: "POST",
      headers: {
        Origin: "http://evil-site.com",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    expect(res.status).toBe(403);
  });
});
