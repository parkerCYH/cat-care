import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';

/**
 * Temporary "current cat" seam (mirrors the same first-cat placeholder logic already in
 * `CatSwitcher.tsx`, which explicitly leaves swapping this in for a later agent — see its
 * comment). Kept local to this feature slice rather than editing the shared CatSwitcher
 * stub or AppLayout, per the phase-1 worktree boundary. Whichever agent wires up the real
 * multi-cat switcher can replace this hook's body without touching call sites.
 */
export function useCurrentCat() {
  const query = useGetApiV1CatCareCats();
  const cats = query.data ?? [];
  const currentCat = cats[0];

  return {
    catId: currentCat?.id,
    cat: currentCat,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
