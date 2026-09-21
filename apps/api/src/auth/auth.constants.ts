import type { Context } from "hono";
import ms from "ms";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_MS = ms("7d");
export const SESSION_ROTATION_AGE_MS = ms("24h");

export function getSessionCookieOptions(c: Context) {
  const forwardedProto = c.req.header("x-forwarded-proto");
  const isHttps = forwardedProto ? forwardedProto === "https" : c.req.url.startsWith("https://");

  const isSecure = process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === "true" : isHttps;

  return {
    httpOnly: true,
    secure: isSecure,
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    path: "/",
    sameSite: "lax" as const,
  };
}
