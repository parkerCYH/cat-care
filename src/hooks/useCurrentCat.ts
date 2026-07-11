import { useEffect, useMemo } from 'react';
import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';
import { useCurrentCatStore } from '@/stores/currentCatStore';

/**
 * Shared "current cat" hook (phase-2 integration pass, issue #10) — the single seam every
 * page should use instead of re-deriving it locally. Backed by `currentCatStore`
 * (persisted to localStorage): if a cat has already been chosen (via `CatSwitcher` or a
 * previous resolution), we use it. Otherwise — first load, or the stored id no longer
 * matches any of the caller's cats (e.g. it was archived/removed) — we fall back to the
 * first non-archived cat from `GET /cats` and persist that choice via `setCurrentCatId`
 * so subsequent reads (and other tabs/pages) agree without refetching.
 *
 * Replaces: 1A's inline fetch in Home.tsx, 1B's original useCurrentCat.ts body, and 1C's
 * useCurrentCatId() in weightShared.ts — all three had the same first-non-archived-cat
 * logic, duplicated because no shared seam existed yet at phase-1 time.
 */
export function useCurrentCat() {
  const query = useGetApiV1CatCareCats();
  const currentCatId = useCurrentCatStore((state) => state.currentCatId);
  const setCurrentCatId = useCurrentCatStore((state) => state.setCurrentCatId);

  const cats = query.data ?? [];
  const storedCat = cats.find((cat) => cat.id === currentCatId && !cat.archivedAt);
  const fallbackCat = cats.find((cat) => !cat.archivedAt);
  const currentCat = storedCat ?? fallbackCat;

  // Persist the resolved fallback so future reads (and other pages/tabs) agree without
  // re-deriving it — only when we actually had to fall back (no stored id, or the stored
  // id no longer resolves to a live cat).
  useEffect(() => {
    if (!storedCat && fallbackCat) {
      setCurrentCatId(fallbackCat.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedCat?.id, fallbackCat?.id]);

  return useMemo(
    () => ({
      catId: currentCat?.id,
      cat: currentCat,
      isLoading: query.isLoading,
      isError: query.isError,
      refetch: query.refetch,
    }),
    [currentCat, query.isLoading, query.isError, query.refetch],
  );
}
