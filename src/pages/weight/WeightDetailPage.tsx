import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetApiV1CatCareCatsCatIdWeightRecordsQueryKey,
  useDeleteApiV1CatCareCatsCatIdWeightRecordsId,
  useGetApiV1CatCareCatsCatIdWeightRecords,
} from '@/api/generated/cat-care/cat-care';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatDateTime, formatKg, methodLabel, useCurrentCatId, useCurrentUserId } from './weightShared';

/**
 * /weight/:id — there is no GET-by-id endpoint on the backend for weight records (only
 * list/POST/PATCH/DELETE), so the record is looked up from the same cached full-list query
 * the chart/table pages already populate. Edit/delete are fully hidden (not just disabled)
 * when `measuredBy` isn't the current player — same rule as issue #7's bowel history.
 */
export function WeightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCatId();
  const currentUserId = useCurrentUserId();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: records, isLoading } = useGetApiV1CatCareCatsCatIdWeightRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const record = useMemo(() => records?.find((item) => item.id === id), [records, id]);

  const deleteMutation = useDeleteApiV1CatCareCatsCatIdWeightRecordsId({
    mutation: {
      onSuccess: () => {
        if (catId) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdWeightRecordsQueryKey(catId),
          });
        }
        navigate('/weight/table', { replace: true });
      },
    },
  });

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-gray-500">找不到這筆體重紀錄</p>
        <Link to="/weight/table" className="text-sm font-medium text-gray-900 underline">
          回體重歷史
        </Link>
      </div>
    );
  }

  const isOwner = !!currentUserId && record.measuredBy === currentUserId;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <dl className="flex flex-col gap-4">
        <div>
          <dt className="text-xs text-gray-500">量測時間</dt>
          <dd className="text-base text-gray-900">{formatDateTime(record.measuredAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">體重</dt>
          <dd className="text-2xl font-semibold text-gray-900">{formatKg(record.weightGrams)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">量測方式</dt>
          <dd className="text-base text-gray-900">{methodLabel(record.method)}</dd>
        </div>
        {record.notes && (
          <div>
            <dt className="text-xs text-gray-500">備註</dt>
            <dd className="text-base text-gray-900 whitespace-pre-wrap">{record.notes}</dd>
          </div>
        )}
      </dl>

      {isOwner && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Link
              to={`/weight/${record.id}/edit`}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-medium text-white"
            >
              編輯
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-red-300 px-4 text-sm font-medium text-red-600"
            >
              刪除
            </button>
          </div>
          {deleteMutation.isError && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-red-600">刪除失敗</p>
              <RetryButton
                onRetry={() => catId && id && deleteMutation.mutate({ catId, id })}
                isPending={deleteMutation.isPending}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="刪除這筆體重紀錄?"
        description="刪除後無法復原。"
        confirmLabel="刪除"
        danger
        onConfirm={() => {
          setConfirmOpen(false);
          if (catId && id) deleteMutation.mutate({ catId, id });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
