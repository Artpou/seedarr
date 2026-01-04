import type { UserSerialized } from "@basement/api/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  user: UserSerialized | null;
  setUser: (user: UserSerialized | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
