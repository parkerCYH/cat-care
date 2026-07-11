import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdWeightRecords } from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatDateTime, formatKg, useCurrentCatId } from './weightShared';

/**
 * /weight/table — date/weight only, whole row navigates to /weight/:id for method + notes
 * (issue #8 resolution). Sorted newest-first. Downsampling/virtualized-list needs for very
 * large record counts are explicitly out of scope this round (left on the wayfinder map as
 * "Not yet specified") — this renders the full already-fetched list.
 */
export function WeightTablePage() {
  const { catId, isLoading: isCatLoading, isError: isCatError } = useCurrentCatId();
  const {
    data: records,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetApiV1CatCareCatsCatIdWeightRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const sorted = useMemo(
    () =>
      [...(records ?? [])].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
      ),
    [records],
  );

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (isCatError || isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm font-medium text-red-600">讀取失敗</p>
        <RetryButton onRetry={() => refetch()} isPending={isRefetching} />
      </div>
    );
  }

  if (sorted.length === 0) {
    return <EmptyState icon="⚖️" text="還沒有體重紀錄" ctaLabel="回首頁記一筆" ctaHref="/" />;
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-100">
      {sorted.map((record) => (
        <li key={record.id}>
          <Link
            to={`/weight/${record.id}`}
            className="flex min-h-[56px] items-center justify-between px-4 py-3 active:bg-gray-50"
          >
            <span className="text-sm text-gray-700">{formatDateTime(record.measuredAt)}</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatKg(record.weightGrams)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
