/** Avoid regressing saved watch position when persisting subtitle prefs before playback seeks. */
export function resolveWatchProgressPosition(options: {
  playerSeconds: number;
  sessionHighWaterMark: number;
  cachedPosition: number;
  resumePosition: number;
  allowWithoutPlayback: boolean;
}): { position: number; skip: boolean } {
  const playerSeconds = Math.max(0, Math.floor(options.playerSeconds));
  const floor = Math.max(
    options.sessionHighWaterMark,
    options.cachedPosition,
    options.allowWithoutPlayback && options.resumePosition > 0 ? options.resumePosition : 0,
  );
  const position = Math.max(floor, playerSeconds);

  if (!options.allowWithoutPlayback && position < 1) {
    return { position, skip: true };
  }

  return { position, skip: false };
}
