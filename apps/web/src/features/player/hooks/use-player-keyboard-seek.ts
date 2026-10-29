import { type RefObject, useEffect } from "react";

import type { MoviPlayerHandle } from "@/features/player/helpers/movi-player.helper";
import { PLAYER_SEEK_SECONDS, seekMoviPlayer } from "@/features/player/helpers/player-seek.helper";

type Options = {
  playerRef: RefObject<MoviPlayerHandle | null>;
  active: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('input, textarea, select, [contenteditable="true"]') != null;
}

/** ArrowLeft / ArrowRight ±10s (desktop play page). */
export function usePlayerKeyboardSeek({ playerRef, active }: Options): void {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (isEditableTarget(event.target)) return;

      const player = playerRef.current;
      if (!player) return;

      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -PLAYER_SEEK_SECONDS : PLAYER_SEEK_SECONDS;
      seekMoviPlayer(player, delta);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, playerRef]);
}
