import { describe, expect, it } from "vitest";

import { shiftSubtitleCueWindow } from "@/features/player/helpers/movi-player.helper";

describe("shiftSubtitleCueWindow", () => {
  it("moves start and end by the same offset and keeps the cue duration", () => {
    const cues = [{ start: 10, end: 12.5 }];

    shiftSubtitleCueWindow(cues, 3);

    expect(cues[0]).toMatchObject({ start: 13, end: 15.5 });
    expect(cues[0].end - cues[0].start).toBeCloseTo(2.5);
  });

  it("re-applies from the original timestamps when the offset changes", () => {
    const cues = [{ start: 10, end: 12 }];

    shiftSubtitleCueWindow(cues, 3);
    shiftSubtitleCueWindow(cues, 1);

    expect(cues[0]).toMatchObject({ start: 11, end: 13 });
  });
});
