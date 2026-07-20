import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getGetApiV1CatCareCatsCatIdFluidInjectionsQueryKey,
  usePatchApiV1CatCareCatsCatIdFluidInjectionsId,
  useGetApiV1CatCareCatsCatIdFluidInjections,
} from '@/api/generated/cat-care/cat-care';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { useCurrentUserId } from '@/lib/currentUser';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { FLUID_TYPE_LABELS, FLUID_TYPE_OPTIONS, SITE_LABELS, SITE_OPTIONS } from '@/lib/fluidInjection';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/date';

const formSchema = z
  .object({
    injectedAt: z.string().min(1, '請選擇時間'),
    site: z.enum(SITE_OPTIONS as [string, ...string[]], { required_error: '請選擇部位' }),
    siteOther: z.string().optional(),
    volumeMl: z.coerce.number({ invalid_type_error: '請輸入 cc 數量' }).int('cc 數量需為整數').positive('cc 數量需大於 0'),
    fluidType: z.enum(FLUID_TYPE_OPTIONS as [string, ...string[]], { required_error: '請選擇輸液種類' }),
    fluidTypeOther: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.site !== 'other' || !!data.siteOther?.trim(), {
    message: '請填寫部位說明',
    path: ['siteOther'],
  })
  .refine((data) => data.fluidType !== 'other' || !!data.fluidTypeOther?.trim(), {
    message: '請填寫輸液種類說明',
    path: ['fluidTypeOther'],
  });

type FormValues = z.infer<typeof formSchema>;

/**
 * `/fluid-injection/:id/edit` — 同 `WeightEditPage`/`BowelEdit` 的「無單筆 GET」限制，從列表快取找
 * 出紀錄回填；非本人直接導回 detail 頁(後端 PATCH 也會 403,這裡只是防禦性 UI 導向)。
 */
export function FluidInjectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const currentUserId = useCurrentUserId();

  const { data: records, isLoading } = useGetApiV1CatCareCatsCatIdFluidInjections(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const record = useMemo(() => records?.find((item) => item.id === id), [records, id]);
  const isOwner = !!currentUserId && !!record && record.injectedBy === currentUserId;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (!record) return;
    reset({
      injectedAt: toDateTimeLocalValue(record.injectedAt),
      site: record.site,
      siteOther: record.siteOther ?? '',
      volumeMl: record.volumeMl,
      fluidType: record.fluidType,
      fluidTypeOther: record.fluidTypeOther ?? '',
      notes: record.notes ?? '',
    });
  }, [record, reset]);

  const site = watch('site');
  const fluidType = watch('fluidType');

  useEffect(() => {
    if (site !== 'other') setValue('siteOther', '');
  }, [site, setValue]);

  useEffect(() => {
    if (fluidType !== 'other') setValue('fluidTypeOther', '');
  }, [fluidType, setValue]);

  const patchMutation = usePatchApiV1CatCareCatsCatIdFluidInjectionsId({
    mutation: {
      onSuccess: () => {
        if (catId) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdFluidInjectionsQueryKey(catId),
          });
        }
        navigate(`/fluid-injection/${id}`, { replace: true });
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

  if (!isOwner) {
    navigate(`/fluid-injection/${record.id}`, { replace: true });
    return null;
  }

  const onSubmit = handleSubmit((values) => {
    if (!catId || !id) return;
    patchMutation.mutate({
      catId,
      id,
      data: {
        injectedAt: fromDateTimeLocalValue(values.injectedAt),
        site: values.site as (typeof SITE_OPTIONS)[number],
        siteOther: values.site === 'other' ? values.siteOther?.trim() : undefined,
        volumeMl: values.volumeMl,
        fluidType: values.fluidType as (typeof FLUID_TYPE_OPTIONS)[number],
        fluidTypeOther: values.fluidType === 'other' ? values.fluidTypeOther?.trim() : undefined,
        notes: values.notes?.trim() || undefined,
      },
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 px-4 py-6">
      <h1 className="text-base font-semibold text-gray-900">編輯點滴紀錄</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="injectedAt" className="text-sm font-medium text-gray-700">
          時間
        </label>
        <input
          id="injectedAt"
          type="datetime-local"
          {...register('injectedAt')}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-base"
        />
        {errors.injectedAt && <p className="text-sm text-red-600">{errors.injectedAt.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">部位</span>
        <div className="flex flex-wrap gap-2">
          {SITE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setValue('site', option, { shouldValidate: true })}
              aria-pressed={site === option}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                site === option ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700'
              }`}
            >
              {SITE_LABELS[option]}
            </button>
          ))}
        </div>
        {errors.site && <p className="text-sm text-red-600">{errors.site.message}</p>}
        {site === 'other' && (
          <input
            type="text"
            placeholder="請說明部位"
            {...register('siteOther')}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        )}
        {errors.siteOther && <p className="text-sm text-red-600">{errors.siteOther.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="volumeMl" className="text-sm font-medium text-gray-700">
          cc 數量
        </label>
        <div className="flex items-center gap-2">
          <input
            id="volumeMl"
            type="number"
            inputMode="numeric"
            step="1"
            {...register('volumeMl')}
            className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-base"
          />
          <span className="text-sm text-gray-500">ml</span>
        </div>
        {errors.volumeMl && <p className="text-sm text-red-600">{errors.volumeMl.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fluidType" className="text-sm font-medium text-gray-700">
          輸液種類
        </label>
        <select
          id="fluidType"
          {...register('fluidType')}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-base"
        >
          {FLUID_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {FLUID_TYPE_LABELS[option]}
            </option>
          ))}
        </select>
        {errors.fluidType && <p className="text-sm text-red-600">{errors.fluidType.message}</p>}
        {fluidType === 'other' && (
          <input
            type="text"
            placeholder="請說明輸液種類"
            {...register('fluidTypeOther')}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        )}
        {errors.fluidTypeOther && <p className="text-sm text-red-600">{errors.fluidTypeOther.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          備註
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {patchMutation.isError && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-red-600">儲存失敗</p>
          <RetryButton onRetry={() => onSubmit()} isPending={patchMutation.isPending} />
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to={`/fluid-injection/${record.id}`}
          className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700"
        >
          取消
        </Link>
        <button
          type="submit"
          disabled={patchMutation.isPending}
          className="flex-1 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {patchMutation.isPending ? '儲存中…' : '儲存'}
        </button>
      </div>
    </form>
  );
}
