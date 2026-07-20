import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetApiV1CatCareCatsCatIdFluidInjectionsQueryKey,
  useDeleteApiV1CatCareCatsCatIdFluidInjectionsId,
  useGetApiV1CatCareCatsCatIdFluidInjections,
} from '@/api/generated/cat-care/cat-care';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { useCurrentUserId } from '@/lib/currentUser';
import { formatFluidType, formatSite, formatVolume } from '@/lib/fluidInjection';

/**
 * `/fluid-injection/:id` — 沒有單筆 GET 端點(比照 weight/bowel),從列表查詢的快取結果中找出對應紀錄。
 * 編輯/刪除只在 `injectedBy` 是本人時顯示(比照票 01「僅本人」的權限規則)。
 */
export function FluidInjectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const currentUserId = useCurrentUserId();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: records, isLoading } = useGetApiV1CatCareCatsCatIdFluidInjections(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const record = useMemo(() => records?.find((item) => item.id === id), [records, id]);

  const deleteMutation = useDeleteApiV1CatCareCatsCatIdFluidInjectionsId({
    mutation: {
      onSuccess: () => {
        if (catId) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdFluidInjectionsQueryKey(catId),
          });
        }
        navigate('/fluid-injection/table', { replace: true });
      },
    },
  });

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-gray-500">找不到這筆點滴紀錄</p>
        <Link to="/fluid-injection/table" className="text-sm font-medium text-gray-900 underline">
          回點滴歷史
        </Link>
      </div>
    );
  }

  const isOwner = !!currentUserId && record.injectedBy === currentUserId;
  const injectedAt = new Date(record.injectedAt);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <dl className="flex flex-col gap-4">
        <div>
          <dt className="text-xs text-gray-500">時間</dt>
          <dd className="text-base text-gray-900">
            {injectedAt.getFullYear()}/{String(injectedAt.getMonth() + 1).padStart(2, '0')}/
            {String(injectedAt.getDate()).padStart(2, '0')} {String(injectedAt.getHours()).padStart(2, '0')}:
            {String(injectedAt.getMinutes()).padStart(2, '0')}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">部位</dt>
          <dd className="text-base text-gray-900">{formatSite(record.site, record.siteOther)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">cc 數量</dt>
          <dd className="text-2xl font-semibold text-gray-900">{formatVolume(record.volumeMl)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">輸液種類</dt>
          <dd className="text-base text-gray-900">{formatFluidType(record.fluidType, record.fluidTypeOther)}</dd>
        </div>
        {record.notes && (
          <div>
            <dt className="text-xs text-gray-500">備註</dt>
            <dd className="whitespace-pre-wrap text-base text-gray-900">{record.notes}</dd>
          </div>
        )}
      </dl>

      {isOwner && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Link
              to={`/fluid-injection/${record.id}/edit`}
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
        title="刪除這筆點滴紀錄?"
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
