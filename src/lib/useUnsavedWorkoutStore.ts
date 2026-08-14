import { create } from "zustand";

interface UnsavedWorkoutStore {
    hasUnsavedProgress: boolean;
    setHasUnsavedProgress: (hasUnsavedProgress: boolean) => void;
}

export const useUnsavedWorkoutStore = create<UnsavedWorkoutStore>((set) => ({
    hasUnsavedProgress: false,
    setHasUnsavedProgress: (hasUnsavedProgress) => set({ hasUnsavedProgress }),
}));
