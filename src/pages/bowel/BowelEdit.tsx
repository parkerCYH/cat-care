import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as zod from 'zod';
import {
  getGetApiV1CatCareCatsCatIdBowelMovementsQueryKey,
  usePatchApiV1CatCareCatsCatIdBowelMovementsId,
  useGetApiV1CatCareCatsCatIdBowelMovements,
} from '@/api/generated/cat-care/cat-care';
import { patchApiV1CatCareCatsCatIdBowelMovementsIdBody } from '@/api/generated-zod/cat-care/cat-care';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUserId } from '@/lib/currentUser';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { STOOL_TYPE_LABELS } from '@/lib/stoolType';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/date';

// The generated body schema validates `recordedAt` as a strict `.datetime()` ISO string
// (with a Z offset), but the form binds it to a native `datetime-local` input whose value
// is a local "YYYY-MM-DDTHH:mm" string — so the form schema relaxes that one field and the
// submit handler converts to a real ISO string before it hits the generated PATCH body type.
const formSchema = patchApiV1CatCareCatsCatIdBowelMovementsIdBody
  .omit({ recordedAt: true })
  .extend({ recordedAt: zod.string().min(1, '請選擇時間') });

type FormValues = zod.infer<typeof formSchema>;

/**
 * /bowel/:id/edit — input-field form, so it's a standalone route per issue #4's convention
 * (not a dialog). Same "no single-record GET" constraint as BowelDetail: reads the record
 * to prefill from the list query. Guards against a non-owner reaching this route directly
 * (the backend would 403 the PATCH anyway, but the form shouldn't render for them).
 */
export function BowelEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = getCurrentUserId(accessToken);

  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1CatCareCatsCatIdBowelMovements(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const patchMutation = usePatchApiV1CatCareCatsCatIdBowelMovementsId();

  const record = records?.find((r) => r.id === id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (record) {
      reset({
        recordedAt: toDateTimeLocalValue(record.recordedAt),
        stoolType: record.stoolType ?? undefined,
        isAbnormal: record.isAbnormal,
        notes: record.notes ?? '',
      });
    }
  }, [record, reset]);

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

  if (!currentUserId || record.recordedBy !== currentUserId) {
    return <Navigate to={`/bowel/${record.id}`} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    if (!catId || !id) return;
    patchMutation.mutate(
      {
        catId,
        id,
        data: {
          recordedAt: fromDateTimeLocalValue(values.recordedAt),
          stoolType: values.stoolType,
          isAbnormal: values.isAbnormal,
          notes: values.notes,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdBowelMovementsQueryKey(catId),
          });
          navigate(`/bowel/${id}`, { replace: true });
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4 py-4">
      <h1 className="text-base font-semibold text-gray-900">編輯排便紀錄</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="recordedAt" className="text-sm font-medium text-gray-700">
          時間
        </label>
        <input
          id="recordedAt"
          type="datetime-local"
          {...register('recordedAt')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        {errors.recordedAt && <p className="text-sm text-red-600">{errors.recordedAt.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="stoolType" className="text-sm font-medium text-gray-700">
          形狀
        </label>
        <select
          id="stoolType"
          {...register('stoolType')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {Object.entries(STOOL_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" {...register('isAbnormal')} className="h-5 w-5" />
        標記為異常
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          備註
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      {patchMutation.isError && (
        <p className="text-sm font-medium text-red-600">儲存失敗,請重試</p>
      )}

      <div className="flex gap-3">
        <Link
          to={`/bowel/${record.id}`}
          className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700"
        >
          取消
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || patchMutation.isPending}
          className="flex-1 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {patchMutation.isPending ? '儲存中…' : '儲存'}
        </button>
      </div>
    </form>
  );
}
