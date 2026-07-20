import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useGetApiV1CatCareCats, usePostApiV1CatCareCatsCatIdFluidInjections } from '@/api/generated/cat-care/cat-care';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirmBackNavigation } from '@/hooks/useConfirmBackNavigation';
import { CHIP_HINT_TEXT, FLUID_TYPE_LABELS, FLUID_TYPE_OPTIONS, SITE_LABELS, SITE_OPTIONS } from '@/lib/fluidInjection';

// 票 01 的驗證規則（site/fluidType 選 other 時對應自由文字欄位必填）在前端先擋一次，避免使用者送出後
// 才從 400 得知漏填；後端仍是最終防線。
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
 * `/fluid-injection/new` — reached via Home's 記一筆點滴 button (票 04). 比照 `BowelNew` 的送出方式
 * (等待 mutation、顯示 pending/error 狀態) 而非 `WeightNew` 的樂觀導航——部位、cc 數量、輸液種類皆為
 * 必填,使用者需要看到驗證結果才知道有沒有漏填。
 */
export function FluidInjectionNew() {
  const navigate = useNavigate();
  const catsQuery = useGetApiV1CatCareCats();
  const catId = catsQuery.data?.find((cat) => !cat.archivedAt)?.id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      injectedAt: toLocalInputValue(new Date()),
      notes: '',
    },
  });

  const site = watch('site');
  const fluidType = watch('fluidType');

  // 票 03 定案:切走「其他」時自動清空已填的自由文字,避免殘留未送出的文字造成使用者誤以為已儲存。
  useEffect(() => {
    if (site !== 'other') setValue('siteOther', '');
  }, [site, setValue]);

  useEffect(() => {
    if (fluidType !== 'other') setValue('fluidTypeOther', '');
  }, [fluidType, setValue]);

  const { pendingLeave, confirmLeave, cancelLeave } = useConfirmBackNavigation(true);

  const mutation = usePostApiV1CatCareCatsCatIdFluidInjections({
    mutation: {
      onSuccess: () => navigate('/', { replace: true }),
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!catId) return;
    mutation.mutate({
      catId,
      data: {
        injectedAt: new Date(values.injectedAt).toISOString(),
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
    <div className="px-4 py-6">
      <h1 className="mb-5 text-lg font-semibold text-gray-900">記一筆點滴</h1>

      <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{CHIP_HINT_TEXT}</div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">時間</span>
          <input
            type="datetime-local"
            {...register('injectedAt')}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
          {errors.injectedAt && <p className="text-sm text-red-600">{errors.injectedAt.message}</p>}
        </label>

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

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">cc 數量</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              {...register('volumeMl')}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base"
            />
            <span className="text-sm text-gray-500">ml</span>
          </div>
          {errors.volumeMl && <p className="text-sm text-red-600">{errors.volumeMl.message}</p>}
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">輸液種類</span>
          <select
            {...register('fluidType')}
            defaultValue=""
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          >
            <option value="" disabled>
              請選擇
            </option>
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

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">備註</span>
          <textarea
            {...register('notes')}
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </label>

        {mutation.isError && <p className="text-sm font-medium text-red-600">記錄失敗,請重試</p>}

        <button
          type="submit"
          disabled={!catId || mutation.isPending}
          className="min-h-[48px] rounded-full bg-gray-900 text-base font-semibold text-white disabled:opacity-50"
        >
          {mutation.isPending ? '送出中…' : '儲存'}
        </button>
      </form>

      <ConfirmDialog
        open={pendingLeave}
        title="放棄這筆紀錄?"
        description="返回將不會儲存目前輸入的內容。"
        confirmLabel="離開"
        cancelLabel="繼續填寫"
        danger
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </div>
  );
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
