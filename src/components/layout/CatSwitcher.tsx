import { useNavigate, useParams } from 'react-router-dom';
import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';
import { useCurrentCatStore } from '@/stores/currentCatStore';

/**
 * Multi-cat switcher (issue #4: dropdown, not tabs — mobile width can't fit many tabs).
 * Wired up as part of issue #9 (cat management) scope: fetches the real cat list and
 * excludes archived cats (same "hidden everywhere" rule as the /cats list, per issue #9's
 * resolution comment — deleted cats are "完全隱藏" from the switcher).
 *
 * Phase-2 integration (issue #10): selecting a cat now updates the shared
 * `currentCatStore` (read by `src/hooks/useCurrentCat.ts`, used across Home/bowel/weight
 * pages) rather than only navigating. The switcher lives in the global AppLayout header
 * — visible on every protected route — so switching should update whatever page the user
 * is currently looking at, not force-navigate them to `/cats/:id`. The one exception: if
 * the user is already on a `/cats/:id`-scoped route (viewing/editing that specific cat),
 * staying put would leave the URL pointing at the cat they just switched away from, so we
 * navigate to the new cat's detail page in that case only.
 */
export function CatSwitcher() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { data } = useGetApiV1CatCareCats();
  const currentCatId = useCurrentCatStore((state) => state.currentCatId);
  const setCurrentCatId = useCurrentCatStore((state) => state.setCurrentCatId);

  const cats = (data ?? []).filter((cat) => !cat.archivedAt);
  const current =
    cats.find((cat) => cat.id === params.id) ?? cats.find((cat) => cat.id === currentCatId) ?? cats[0];

  if (cats.length === 0) {
    return <span className="max-w-[45vw] truncate text-base font-semibold text-gray-900">貓咪管理</span>;
  }

  if (cats.length === 1) {
    return <span className="max-w-[45vw] truncate text-base font-semibold text-gray-900">{cats[0].name}</span>;
  }

  function handleChange(id: string) {
    setCurrentCatId(id);
    // Only force-navigate when we're already viewing a specific cat's own route —
    // otherwise let the current page (Home, bowel/weight history, etc.) pick up the new
    // current cat via the shared store without moving the user anywhere.
    if (params.id) {
      navigate(`/cats/${id}`);
    }
  }

  return (
    <select
      aria-label="切換貓咪"
      value={current?.id}
      onChange={(event) => handleChange(event.target.value)}
      className="max-w-[45vw] truncate bg-transparent text-base font-semibold text-gray-900"
    >
      {cats.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
