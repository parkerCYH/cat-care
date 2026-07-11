import { useNavigate, useParams } from 'react-router-dom';
import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';

/**
 * Multi-cat switcher (issue #4: dropdown, not tabs — mobile width can't fit many tabs).
 * Wired up as part of issue #9 (cat management) scope: fetches the real cat list and
 * excludes archived cats (same "hidden everywhere" rule as the /cats list). Component
 * stays parameterless — same shape other phase-1 agents may already depend on — so the
 * "current cat" seam here is just "which cat detail route are we on" (via useParams),
 * and switching navigates to that cat's `/cats/:id` detail route. Home/bowel/weight
 * pages haven't landed yet on main at the time of writing; if those later agents want a
 * different notion of "current cat" (e.g. a shared store), this onChange is the one
 * spot to change it.
 */
export function CatSwitcher() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { data } = useGetApiV1CatCareCats();

  const cats = (data ?? []).filter((cat) => !cat.archivedAt);
  const current = cats.find((cat) => cat.id === params.id) ?? cats[0];

  if (cats.length === 0) {
    return <span className="max-w-[45vw] truncate text-base font-semibold text-gray-900">貓咪管理</span>;
  }

  return (
    <select
      aria-label="切換貓咪"
      value={current?.id}
      disabled={cats.length <= 1}
      onChange={(event) => navigate(`/cats/${event.target.value}`)}
      className="max-w-[45vw] truncate bg-transparent text-base font-semibold text-gray-900 disabled:opacity-100"
    >
      {cats.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
