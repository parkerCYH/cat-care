import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useGetApiV1CatCareCats, usePostApiV1CatCareCatsCatIdWeightRecords } from '@/api/generated/cat-care/cat-care';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirmBackNavigation } from '@/hooks/useConfirmBackNavigation';
import { WEIGHT_METHOD_LABELS, WEIGHT_METHOD_OPTIONS, WEIGHT_METHOD_STORAGE_KEY } from '@/lib/weightMethod';

// A locally-scoped schema rather than the orval-generated one directly: the generated body
// schema validates `weightGrams` (integer grams, matching the API), but the UI collects kg
// with a decimal keypad (issue #6: "體重必須輸入數字"), so the unit conversion has to happen
// between form values and the API payload — kept here instead of trying to bend the
// generated schema to a different unit.
const weightFormSchema = z.object({
  measuredAt: z.string().min(1, '請選擇時間'),
  weightKg: z.coerce.number({ invalid_type_error: '請輸入體重' }).positive('體重需大於 0'),
  // The <select> can only ever submit a string — '' is the "未指定" option — so this stays
  // untransformed here and gets mapped to the API's optional method field in onSubmit.
  method: z.enum(['catScale', 'holdAndSubtract', 'other', '']).optional(),
  notes: z.string().optional(),
});

type WeightFormValues = z.infer<typeof weightFormSchema>;

/**
 * `/weight/new` — weight must always be a standalone route (no 2-tap default like bowel,
 * since a number always has to be typed in). Numeric keypad auto-focuses; the measuring
 * method select defaults to whatever the user picked last time (remembered in
 * localStorage). Submitting is optimistic — fires the mutation and returns to Home right
 * away rather than waiting for the response (issue #6 resolution).
 */
export function WeightNew() {
  const navigate = useNavigate();
  const catsQuery = useGetApiV1CatCareCats();
  const catId = catsQuery.data?.find((cat) => !cat.archivedAt)?.id;

  const lastMethod = readLastMethod();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      measuredAt: toLocalInputValue(new Date()),
      method: lastMethod,
      notes: '',
    },
  });

  useEffect(() => {
    setFocus('weightKg');
  }, [setFocus]);

  const { pendingLeave, confirmLeave, cancelLeave } = useConfirmBackNavigation(true);

  const mutation = usePostApiV1CatCareCatsCatIdWeightRecords();

  function onSubmit(values: WeightFormValues) {
    if (!catId) return;

    const method = values.method || undefined;
    if (method) {
      window.localStorage.setItem(WEIGHT_METHOD_STORAGE_KEY, method);
    }

    // Optimistic UI (issue #6): fire the mutation and leave immediately rather than
    // waiting for the response — a failure is not re-surfaced on this page since the user
    // has already navigated away.
    mutation.mutate({
      catId,
      data: {
        measuredAt: new Date(values.measuredAt).toISOString(),
        weightGrams: Math.round(values.weightKg * 1000),
        method,
        notes: values.notes?.trim() || undefined,
      },
    });
    navigate('/', { replace: true });
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-5 text-lg font-semibold text-gray-900">記一筆體重</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">時間</span>
          <input
            type="datetime-local"
            {...register('measuredAt')}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
          {errors.measuredAt && <p className="text-sm text-red-600">{errors.measuredAt.message}</p>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">體重 (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            {...register('weightKg')}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
          {errors.weightKg && <p className="text-sm text-red-600">{errors.weightKg.message}</p>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">量測方式</span>
          <select
            {...register('method')}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          >
            <option value="">未指定</option>
            {WEIGHT_METHOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {WEIGHT_METHOD_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">備註</span>
          <textarea
            {...register('notes')}
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </label>

        <button
          type="submit"
          disabled={!catId}
          className="min-h-[48px] rounded-full bg-gray-900 text-base font-semibold text-white disabled:opacity-50"
        >
          儲存
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

function readLastMethod(): WeightFormValues['method'] {
  const stored = window.localStorage.getItem(WEIGHT_METHOD_STORAGE_KEY);
  if (stored && (WEIGHT_METHOD_OPTIONS as string[]).includes(stored)) {
    return stored as WeightFormValues['method'];
  }
  return undefined;
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
