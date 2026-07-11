import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Shared "current cat" seam (phase-2 integration pass, issue #10). Phase-1 agents each
 * built their own local workaround for this (1A: inline fetch in Home.tsx, 1B:
 * useCurrentCat.ts, 1C: useCurrentCatId() in weightShared.ts, 1D: CatSwitcher wired to
 * real data but only navigating on selection) since no shared seam existed yet. This
 * store is the single source of truth every page should read via
 * `src/hooks/useCurrentCat.ts` — mirrors the persist + createJSONStorage pattern in
 * `src/stores/authStore.ts` for consistency.
 */
interface CurrentCatState {
  /** Persisted to localStorage. Null until a cat has been resolved/selected at least once. */
  currentCatId: string | null;
  setCurrentCatId: (id: string) => void;
}

export const useCurrentCatStore = create<CurrentCatState>()(
  persist(
    (set) => ({
      currentCatId: null,
      setCurrentCatId: (id: string) => set({ currentCatId: id }),
    }),
    {
      name: 'cat-care-current-cat',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
