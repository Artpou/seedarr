import { create } from "zustand";

type TvSidebarStore = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  lastContentFocusKey: string | null;
  pendingContentFocusRestore: boolean;
  setLastContentFocusKey: (focusKey: string) => void;
  markPendingContentFocusRestore: () => void;
  consumePendingContentFocusRestore: () => boolean;
};

export const useTvSidebarStore = create<TvSidebarStore>((set, get) => ({
  expanded: false,
  setExpanded: (expanded) => set({ expanded }),
  lastContentFocusKey: null,
  pendingContentFocusRestore: false,
  setLastContentFocusKey: (focusKey) => set({ lastContentFocusKey: focusKey }),
  markPendingContentFocusRestore: () => set({ pendingContentFocusRestore: true }),
  consumePendingContentFocusRestore: () => {
    if (!get().pendingContentFocusRestore) return false;
    set({ pendingContentFocusRestore: false });
    return true;
  },
}));

/** Focus keys for the TV app sidebar (expand on focus). */
export function isTvSidebarNavFocusKey(focusKey: string): boolean {
  if (focusKey === "NAV-THEME" || focusKey === "NAV-/settings" || focusKey === "NAV-/search") return true;
  if (focusKey === "NAV-/movies" || focusKey === "NAV-/tv" || focusKey === "NAV-/downloads") return true;
  if (focusKey.startsWith("NAV-/user/$id-")) return true;
  return false;
}
