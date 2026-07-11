import { Link, useParams } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatId } from '@/api/generated/cat-care/cat-care';
import { RetryButton } from '@/components/RetryState/RetryButton';

/**
 * `/cats/:id/edit` — route exists per the issue #9 route table, but the backend
 * currently exposes no PATCH/PUT for a cat's basic info (confirmed against
 * /api/v1/cat-care/cats/{catId} in openapi.json: only GET and DELETE are defined —
 * DELETE is the archive/soft-delete action, not an update). The issue's resolution
 * comment accepted the reference layout for "編輯貓咪基本資料" at face value without
 * flagging this backend gap, so rather than silently no-op a save button (which would
 * mislead the user into thinking their edit persisted), this page is an honest notice
 * with the current values shown read-only. Swap this for a real form once the backend
 * adds an update endpoint.
 */
export function CatEdit() {
  const { id } = useParams<{ id: string }>();
  const catId = id ?? '';
  const catQuery = useGetApiV1CatCareCatsCatId(catId);
  const cat = catQuery.data;

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">編輯貓咪資料</h1>

      {catQuery.isLoading && <p className="text-sm text-gray-500">載入中…</p>}

      {catQuery.isError && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-red-600">貓咪資料載入失敗</p>
          <RetryButton onRetry={() => catQuery.refetch()} isPending={catQuery.isFetching} />
        </div>
      )}

      {cat && (
        <>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              目前後端尚未提供編輯貓咪基本資料的 API,此功能暫不可用。
            </p>
          </div>

          <dl className="mt-4 space-y-2 text-sm text-gray-600">
            <div>
              <dt className="text-gray-400">名字</dt>
              <dd className="text-gray-900">{cat.name}</dd>
            </div>
            <div>
              <dt className="text-gray-400">出生日期</dt>
              <dd>{cat.birthdate ?? '未填寫'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">備註</dt>
              <dd>{cat.notes ?? '未填寫'}</dd>
            </div>
          </dl>

          <Link
            to={`/cats/${catId}`}
            className="mt-6 inline-block rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            返回貓咪詳情
          </Link>
        </>
      )}
    </div>
  );
}
