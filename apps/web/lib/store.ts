"use client";

import { create } from "zustand";

type UiState = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  theme: "dark",
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" }))
}));

