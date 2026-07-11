import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getGetApiV1CatCareCatsCatIdWeightRecordsQueryKey,
  usePatchApiV1CatCareCatsCatIdWeightRecordsId,
  useGetApiV1CatCareCatsCatIdWeightRecords,
} from '@/api/generated/cat-care/cat-care';
import { patchApiV1CatCareCatsCatIdWeightRecordsIdBodyWeightGramsMin } from '@/api/generated-zod/cat-care/cat-care';
import {
  METHOD_OPTIONS,
  fromDatetimeLocalValue,
  gramsFromKgInput,
  toDatetimeLocalValue,
} from './weightShared';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { useCurrentUserId } from '@/lib/currentUser';

/**
 * Form-level schema mirrors the generated PATCH body (src/api/generated-zod/cat-care/cat-care.ts
 * `patchApiV1CatCareCatsCatIdWeightRecordsIdBody`), but the weight field is expressed in kg —
 * the displayed unit (issue #8 decision) — instead of the raw `weightGrams` the API stores and
 * validates. The kg minimum reuses the generated grams-min constant so the two stay in sync;
 * the kg value is converted back to whole grams right before the PATCH call.
 */
const editSchema = z.object({
  measuredAt: z.string().min(1, '請選擇量測時間'),
  weightKg: z.coerce
    .number()
    .gt(patchApiV1CatCareCatsCatIdWeightRecordsIdBodyWeightGramsMin / 1000, '體重需大於 0'),
  method: z.enum(['catScale', 'holdAndSubtract', 'other']),
  notes: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export function WeightEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const currentUserId = useCurrentUserId();

  const { data: records, isLoading } = useGetApiV1CatCareCatsCatIdWeightRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const record = useMemo(() => records?.find((item) => item.id === id), [records, id]);
  const isOwner = !!currentUserId && !!record && record.measuredBy === currentUserId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (!record) return;
    reset({
      measuredAt: toDatetimeLocalValue(record.measuredAt),
      weightKg: Number((record.weightGrams / 1000).toFixed(2)),
      method: record.method ?? 'other',
      notes: record.notes ?? '',
    });
  }, [record, reset]);

  const patchMutation = usePatchApiV1CatCareCatsCatIdWeightRecordsId({
    mutation: {
      onSuccess: () => {
        if (catId) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdWeightRecordsQueryKey(catId),
          });
        }
        navigate(`/weight/${id}`, { replace: true });
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

  // Backend 403s a non-owner PATCH anyway; this is a defensive UI redirect so a non-owner
  // never even sees the form (mirrors the hidden edit/delete entry points on the detail page).
  if (!isOwner) {
    navigate(`/weight/${record.id}`, { replace: true });
    return null;
  }

  const onSubmit = (values: EditFormValues) => {
    if (!catId || !id) return;
    patchMutation.mutate({
      catId,
      id,
      data: {
        measuredAt: fromDatetimeLocalValue(values.measuredAt),
        weightGrams: gramsFromKgInput(values.weightKg),
        method: values.method,
        notes: values.notes || undefined,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="measuredAt" className="text-sm font-medium text-gray-700">
          量測時間
        </label>
        <input
          id="measuredAt"
          type="datetime-local"
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-base"
          {...register('measuredAt')}
        />
        {errors.measuredAt && <p className="text-sm text-red-600">{errors.measuredAt.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="weightKg" className="text-sm font-medium text-gray-700">
          體重(公斤)
        </label>
        <input
          id="weightKg"
          type="number"
          inputMode="decimal"
          step="0.01"
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-base"
          {...register('weightKg')}
        />
        {errors.weightKg && <p className="text-sm text-red-600">{errors.weightKg.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="method" className="text-sm font-medium text-gray-700">
          量測方式
        </label>
        <select
          id="method"
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-base"
          {...register('method')}
        >
          {METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          備註
        </label>
        <textarea
          id="notes"
          rows={3}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base"
          {...register('notes')}
        />
      </div>

      {patchMutation.isError && <p className="text-sm font-medium text-red-600">儲存失敗,請再試一次</p>}

      <button
        type="submit"
        disabled={patchMutation.isPending}
        className="min-h-[44px] rounded-full bg-gray-900 px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {patchMutation.isPending ? '儲存中…' : '儲存'}
      </button>
    </form>
  );
}
