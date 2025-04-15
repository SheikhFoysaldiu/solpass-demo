import { create } from "zustand";

type ViewMode = "user" | "team";

interface ViewModeState {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  mode: "user", // Default mode is user
  setMode: (mode) => set({ mode }),
  toggleMode: () =>
    set((state) => ({ mode: state.mode === "user" ? "team" : "user" })),
}));
