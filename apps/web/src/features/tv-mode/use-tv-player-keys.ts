import { useEffect, useRef } from "react";

import { useRouter } from "@tanstack/react-router";

import type { MoviPlayerHandle } from "@/features/player/helpers/movi-player.helper";
import { PLAYER_SEEK_SECONDS, seekMoviPlayer } from "@/features/player/helpers/player-seek.helper";
import {
  activateTvMoviBarControl,
  activateTvMoviMenuItem,
  clearTvMoviControlFocus,
  closeOpenTvMoviMenus,
  focusTvMoviBarControl,
  focusTvMoviMenuItem,
  getFocusedTvMoviMenuButton,
  getOpenTvMoviMenu,
  hideMoviControlBar,
  moveTvMoviMenuFocusHorizontal,
  showMoviControlBar,
  syncTvMoviMenuFocusIndex,
} from "@/features/tv-mode/tv-movi-player-controls.helper";
import { useTvMode } from "./tv-mode-store";

type Options = {
  playerRef: React.RefObject<MoviPlayerHandle | null>;
  active: boolean;
};

/** Remote-friendly playback keys while in TV mode (Enter, arrows, Back). */
export function useTvPlayerKeys({ playerRef, active }: Options) {
  const tvMode = useTvMode();
  const router = useRouter();
  const barFocusIndexRef = useRef(-1);
  const menuFocusIndexRef = useRef(-1);
  const keepBarVisibleTimerRef = useRef<number | undefined>(undefined);
  const playerChromeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!tvMode || !active) return;

    const stopKeepBarVisible = (): void => {
      if (keepBarVisibleTimerRef.current !== undefined) {
        window.clearInterval(keepBarVisibleTimerRef.current);
        keepBarVisibleTimerRef.current = undefined;
      }
    };

    const startKeepBarVisible = (player: MoviPlayerHandle): void => {
      showMoviControlBar(player);
      stopKeepBarVisible();
      keepBarVisibleTimerRef.current = window.setInterval(() => {
        showMoviControlBar(playerRef.current ?? player);
      }, 800);
    };

    const exitBarFocus = (player: MoviPlayerHandle): void => {
      menuFocusIndexRef.current = -1;
      closeOpenTvMoviMenus(player);
      barFocusIndexRef.current = -1;
      clearTvMoviControlFocus(player);
      if (!player.paused) hideMoviControlBar(player);
    };

    const enterBarFocus = (player: MoviPlayerHandle): boolean => {
      showMoviControlBar(player);
      const index = focusTvMoviBarControl(player, Math.max(0, barFocusIndexRef.current));
      if (index < 0) return false;
      barFocusIndexRef.current = index;
      menuFocusIndexRef.current = -1;
      return true;
    };

    const enterMenuFocus = (player: MoviPlayerHandle): boolean => {
      const menu = getOpenTvMoviMenu(player);
      if (!menu) {
        menuFocusIndexRef.current = -1;
        return false;
      }
      const index = focusTvMoviMenuItem(player, Math.max(0, menuFocusIndexRef.current));
      if (index < 0) return false;
      menuFocusIndexRef.current = index;
      return true;
    };

    const closeMenuFocus = (player: MoviPlayerHandle): void => {
      menuFocusIndexRef.current = -1;
      closeOpenTvMoviMenus(player);
      if (barFocusIndexRef.current >= 0) {
        focusTvMoviBarControl(player, barFocusIndexRef.current);
      } else {
        clearTvMoviControlFocus(player);
      }
    };

    const attachPlayerChrome = (player: MoviPlayerHandle): void => {
      playerChromeCleanupRef.current?.();
      playerChromeCleanupRef.current = null;

      const onPause = (): void => {
        startKeepBarVisible(player);
      };

      const onPlay = (): void => {
        stopKeepBarVisible();
        if (barFocusIndexRef.current < 0) hideMoviControlBar(player);
      };

      player.addEventListener("pause", onPause);
      player.addEventListener("play", onPlay);
      if (player.paused) startKeepBarVisible(player);

      playerChromeCleanupRef.current = () => {
        player.removeEventListener("pause", onPause);
        player.removeEventListener("play", onPlay);
        stopKeepBarVisible();
        clearTvMoviControlFocus(player);
      };
    };

    const attachPoll = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || playerChromeCleanupRef.current) return;
      attachPlayerChrome(player);
    }, 150);

    const onKeyDown = (event: KeyboardEvent) => {
      const player = playerRef.current;
      const key = event.key;

      if (!player) {
        if (key === "Escape" || key === "Backspace" || key === "BrowserBack") {
          event.preventDefault();
          router.history.back();
        }
        return;
      }

      const openMenu = getOpenTvMoviMenu(player);
      const inMenu = openMenu != null && menuFocusIndexRef.current >= 0;
      const inBar = barFocusIndexRef.current >= 0;

      if (key === "Escape" || key === "Backspace" || key === "BrowserBack") {
        event.preventDefault();
        if (openMenu) {
          closeMenuFocus(player);
          return;
        }
        if (inBar) {
          exitBarFocus(player);
          return;
        }
        router.history.back();
        return;
      }

      if (openMenu) {
        if (key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          if (inMenu && moveTvMoviMenuFocusHorizontal(player, -1)) {
            const synced = syncTvMoviMenuFocusIndex(player);
            if (synced >= 0) menuFocusIndexRef.current = synced;
            return;
          }
          closeMenuFocus(player);
          return;
        }

        if (key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          if (!inMenu) enterMenuFocus(player);
          if (moveTvMoviMenuFocusHorizontal(player, 1)) {
            const synced = syncTvMoviMenuFocusIndex(player);
            if (synced >= 0) menuFocusIndexRef.current = synced;
            return;
          }
          return;
        }

        if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter") {
          if (!inMenu) enterMenuFocus(player);

          if (key === "ArrowDown") {
            event.preventDefault();
            event.stopPropagation();
            const next = focusTvMoviMenuItem(player, menuFocusIndexRef.current + 1);
            if (next >= 0) menuFocusIndexRef.current = next;
            return;
          }

          if (key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            const next = focusTvMoviMenuItem(player, menuFocusIndexRef.current - 1);
            if (next >= 0) menuFocusIndexRef.current = next;
            return;
          }

          if (key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            const focusedBtn = getFocusedTvMoviMenuButton(player);
            if (focusedBtn?.closest("[data-seedarr-cc-extras]")) {
              focusedBtn.click();
              return;
            }
            activateTvMoviMenuItem(player, menuFocusIndexRef.current);
            window.requestAnimationFrame(() => {
              const p = playerRef.current;
              if (!p || getOpenTvMoviMenu(p)) return;
              menuFocusIndexRef.current = -1;
              if (barFocusIndexRef.current >= 0) focusTvMoviBarControl(p, barFocusIndexRef.current);
            });
            return;
          }
        }

        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        if (!inBar) enterBarFocus(player);
        else showMoviControlBar(player);
        return;
      }

      if (key === "ArrowUp" && inBar) {
        event.preventDefault();
        event.stopPropagation();
        exitBarFocus(player);
        return;
      }

      if (inBar && (key === "ArrowLeft" || key === "ArrowRight")) {
        event.preventDefault();
        event.stopPropagation();
        const delta = key === "ArrowLeft" ? -1 : 1;
        const next = focusTvMoviBarControl(player, barFocusIndexRef.current + delta);
        if (next >= 0) barFocusIndexRef.current = next;
        return;
      }

      if (key === "Enter") {
        event.preventDefault();
        if (inBar) {
          activateTvMoviBarControl(player, barFocusIndexRef.current);
          window.requestAnimationFrame(() => {
            const p = playerRef.current;
            if (!p || !getOpenTvMoviMenu(p)) return;
            menuFocusIndexRef.current = 0;
            focusTvMoviMenuItem(p, 0);
          });
          return;
        }
        if (player.paused) void player.play();
        else player.pause();
        return;
      }

      if (inBar) return;

      if (key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        seekMoviPlayer(player, -PLAYER_SEEK_SECONDS);
        return;
      }

      if (key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        seekMoviPlayer(player, PLAYER_SEEK_SECONDS);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearInterval(attachPoll);
      stopKeepBarVisible();
      playerChromeCleanupRef.current?.();
      playerChromeCleanupRef.current = null;
      barFocusIndexRef.current = -1;
      menuFocusIndexRef.current = -1;
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [tvMode, active, playerRef, router.history]);
}
