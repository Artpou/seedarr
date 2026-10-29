import { describe, expect, it } from "vitest";

import { accumulateSeekStack, PLAYER_SEEK_SECONDS, seekMoviPlayer } from "@/features/player/helpers/player-seek.helper";

describe("player-seek.helper", () => {
  it("stacks rapid seeks in the same direction", () => {
    const t0 = 1000;
    let stack = accumulateSeekStack({ direction: null, totalSeconds: 0, lastAt: 0 }, PLAYER_SEEK_SECONDS, t0);
    expect(stack.totalSeconds).toBe(10);

    stack = accumulateSeekStack(stack, PLAYER_SEEK_SECONDS, t0 + 200);
    expect(stack.totalSeconds).toBe(20);
    expect(stack.direction).toBe("forward");

    stack = accumulateSeekStack(stack, PLAYER_SEEK_SECONDS, t0 + 400);
    expect(stack.totalSeconds).toBe(30);

    stack = accumulateSeekStack(stack, -PLAYER_SEEK_SECONDS, t0 + 500);
    expect(stack.totalSeconds).toBe(10);
    expect(stack.direction).toBe("backward");

    stack = accumulateSeekStack(stack, PLAYER_SEEK_SECONDS, t0 + 2000);
    expect(stack.totalSeconds).toBe(10);
    expect(stack.direction).toBe("forward");
  });

  it("clamps seek to duration bounds", () => {
    const player = {
      currentTime: 5,
      duration: 100,
    } as HTMLMediaElement;

    seekMoviPlayer(player as never, PLAYER_SEEK_SECONDS);
    expect(player.currentTime).toBe(15);

    player.currentTime = 98;
    seekMoviPlayer(player as never, PLAYER_SEEK_SECONDS);
    expect(player.currentTime).toBe(100);

    player.currentTime = 3;
    seekMoviPlayer(player as never, -PLAYER_SEEK_SECONDS);
    expect(player.currentTime).toBe(0);
  });
});
