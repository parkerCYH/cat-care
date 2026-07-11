import { Link } from 'react-router-dom';
import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';

/**
 * `/cats` — list of cats the caller belongs to (issue #9 resolution). Archived cats
 * (`archivedAt` set) are filtered out everywhere per the resolution comment ("刪除後在
 * 貓咪列表頁、首頁貓咪切換器完全隱藏"). Still shown as a list even with a single cat —
 * no special-cased single-cat skip.
 */
export function CatsList() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetApiV1CatCareCats();

  const cats = (data ?? []).filter((cat) => !cat.archivedAt);

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">貓咪管理</h1>
        <Link
          to="/cats/new"
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          + 新增貓咪
        </Link>
      </div>

      {isLoading && <p className="py-8 text-center text-sm text-gray-500">載入中…</p>}

      {isError && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-medium text-red-600">貓咪清單載入失敗</p>
          <RetryButton onRetry={() => refetch()} isPending={isRefetching} />
        </div>
      )}

      {!isLoading && !isError && cats.length === 0 && (
        <EmptyState icon="🐱" text="還沒有貓咪,新增第一隻吧" ctaLabel="+ 新增貓咪" ctaHref="/cats/new" />
      )}

      {!isLoading && !isError && cats.length > 0 && (
        <ul className="flex flex-col gap-2">
          {cats.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/cats/${cat.id}`}
                className="flex min-h-[56px] items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-2xl" aria-hidden="true">
                  🐱
                </span>
                <span className="flex-1 truncate text-sm font-medium text-gray-900">{cat.name}</span>
                <span className="text-gray-400" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
