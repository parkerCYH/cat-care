import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetApiV1CatCareCatsCatIdBowelMovementsQueryKey,
  useDeleteApiV1CatCareCatsCatIdBowelMovementsId,
  useGetApiV1CatCareCatsCatIdBowelMovements,
} from '@/api/generated/cat-care/cat-care';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUserId } from '@/lib/currentUser';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatStoolType } from '@/lib/stoolType';

/**
 * /bowel/:id — single record detail. No single-record GET exists on the backend (only
 * list/patch/delete), so this reads from the same list query used elsewhere and finds the
 * matching id — fetched without from/to so it can locate a record regardless of which
 * range the calendar/table page linked in from.
 *
 * Edit/delete are fully hidden (not disabled) when `recordedBy` isn't the current user,
 * per the issue #7 resolution comment. Delete goes through ConfirmDialog, never a route.
 */
export function BowelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = getCurrentUserId(accessToken);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1CatCareCatsCatIdBowelMovements(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const deleteMutation = useDeleteApiV1CatCareCatsCatIdBowelMovementsId();

  const record = records?.find((r) => r.id === id);
  const isOwner = !!record && !!currentUserId && record.recordedBy === currentUserId;

  const handleDelete = () => {
    if (!catId || !id) return;
    deleteMutation.mutate(
      { catId, id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdBowelMovementsQueryKey(catId),
          });
          navigate('/bowel/table', { replace: true });
        },
        onSettled: () => setConfirmOpen(false),
      },
    );
  };

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8">
        <p className="text-sm font-medium text-red-600">載入失敗</p>
        <RetryButton onRetry={() => refetch()} />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="text-sm text-gray-500">找不到這筆紀錄</p>
        <Link to="/bowel/table" className="text-sm font-medium text-gray-900 underline">
          回排便歷史
        </Link>
      </div>
    );
  }

  const recordedAt = new Date(record.recordedAt);

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${record.isAbnormal ? 'bg-red-600' : 'bg-green-600'}`}
        />
        <h1 className="text-base font-semibold text-gray-900">
          {record.isAbnormal ? '異常紀錄' : '正常紀錄'}
        </h1>
      </div>

      <dl className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-100">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-sm text-gray-500">時間</dt>
          <dd className="text-sm text-gray-900">
            {recordedAt.getFullYear()}/{String(recordedAt.getMonth() + 1).padStart(2, '0')}/
            {String(recordedAt.getDate()).padStart(2, '0')}{' '}
            {String(recordedAt.getHours()).padStart(2, '0')}:
            {String(recordedAt.getMinutes()).padStart(2, '0')}
          </dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-sm text-gray-500">形狀</dt>
          <dd className="text-sm text-gray-900">{formatStoolType(record.stoolType)}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-sm text-gray-500">是否異常</dt>
          <dd className="text-sm text-gray-900">{record.isAbnormal ? '是' : '否'}</dd>
        </div>
        <div className="flex flex-col gap-1 px-4 py-3">
          <dt className="text-sm text-gray-500">備註</dt>
          <dd className="text-sm text-gray-900">{record.notes || '—'}</dd>
        </div>
      </dl>

      {isOwner && (
        <div className="flex gap-3">
          <Link
            to={`/bowel/${record.id}/edit`}
            className="flex-1 rounded-full bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white"
          >
            編輯
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex-1 rounded-full border border-red-200 px-4 py-3 text-sm font-medium text-red-600"
          >
            刪除
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="刪除這筆排便紀錄？"
        description="刪除後無法復原。"
        confirmLabel="刪除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
