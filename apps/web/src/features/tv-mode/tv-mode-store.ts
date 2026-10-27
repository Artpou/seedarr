import { create } from "zustand";

type TvModeState = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export const useTvModeStore = create<TvModeState>((set) => ({
  enabled: false,
  setEnabled: (enabled) => set({ enabled }),
}));

export function useTvMode(): boolean {
  return useTvModeStore((state) => state.enabled);
}
