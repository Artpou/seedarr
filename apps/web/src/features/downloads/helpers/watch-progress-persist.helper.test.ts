import { describe, expect, it } from "vitest";

import { resolveWatchProgressPosition } from "./watch-progress-persist.helper";

describe("resolveWatchProgressPosition", () => {
  it("does not save position 0 over a resume point when only subtitle prefs change", () => {
    const result = resolveWatchProgressPosition({
      playerSeconds: 0,
      sessionHighWaterMark: 3600,
      cachedPosition: 3600,
      resumePosition: 3600,
      allowWithoutPlayback: true,
    });

    expect(result.skip).toBe(false);
    expect(result.position).toBe(3600);
  });

  it("skips periodic save until playback has started", () => {
    const result = resolveWatchProgressPosition({
      playerSeconds: 0,
      sessionHighWaterMark: 0,
      cachedPosition: 0,
      resumePosition: 0,
      allowWithoutPlayback: false,
    });

    expect(result.skip).toBe(true);
  });
});
