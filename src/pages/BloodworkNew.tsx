import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { usePostApiV1CatCareCatsCatIdBloodworkRecords } from '@/api/generated/cat-care/cat-care';
import { postApiV1CatCareCatsCatIdBloodworkRecordsBody } from '@/api/generated-zod/cat-care/cat-care';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirmBackNavigation } from '@/hooks/useConfirmBackNavigation';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { BIOCHEM_FIELDS, CBC_FIELDS, type BloodworkField } from '@/lib/bloodwork';

// 空字串代表「這欄沒填」,轉成 undefined 讓後面的 z.coerce.number() 只需要處理「有填」的情況
// (票 19:34 欄位皆選填,z.coerce.number() 直接套用空字串會被強制轉成 0,不是我們要的語意)。
const optionalNumberInput = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.coerce.number({ invalid_type_error: '請輸入數字' }).nullish(),
);

// 34 欄位共用同一條驗證規則,直接複用票 18 的 orval 產生 zod schema(postApiV1CatCareCatsCatIdBloodworkRecordsBody)
// 當底稿——只覆寫這 34 個數值欄位(html number input 給的是字串,套上面的 optionalNumberInput 轉型)
// 與 recordedAt(表單這裡用 datetime-local 原始字串,送出時才轉 ISO,比照 FluidInjectionNew 的作法),
// 不手動另外重打一份 34 欄位清單。
const formSchema = postApiV1CatCareCatsCatIdBloodworkRecordsBody.extend({
  recordedAt: z.string().min(1, '請選擇時間'),
  ...Object.fromEntries(
    [...BIOCHEM_FIELDS, ...CBC_FIELDS].map((field) => [field.key, optionalNumberInput]),
  ),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * `/bloodwork/new` — 票 19:手動填寫驗血紀錄。比照原型 VariantA 的手動填寫分支,一次性表單、
 * 不經過 draft/confirm 兩態(票 13 定案),送出即 `status: confirmed`。34 欄位分「生化」「CBC
 * 血球」兩個可收合區塊,全部選填,只接受數字。比照 FluidInjectionNew 等待 mutation 結果而非
 * 樂觀導航——34 欄位打錯或送出失敗時,使用者需要留在表單上才不會白打一輪。
 */
export function BloodworkNew() {
  const navigate = useNavigate();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const [openSection, setOpenSection] = useState<'biochem' | 'cbc' | null>('biochem');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recordedAt: toLocalInputValue(new Date()),
    },
  });

  const { pendingLeave, confirmLeave, cancelLeave } = useConfirmBackNavigation(true);

  const mutation = usePostApiV1CatCareCatsCatIdBloodworkRecords({
    mutation: {
      onSuccess: (record) => navigate(`/bloodwork/${record.id}`, { replace: true }),
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!catId) return;
    const { recordedAt, ...fieldValues } = values;
    mutation.mutate({
      catId,
      data: {
        recordedAt: new Date(recordedAt).toISOString(),
        ...fieldValues,
      },
    });
  });

  return (
    <div className="px-4 py-6 pb-10">
      <h1 className="mb-5 text-lg font-semibold text-gray-900">手動填寫驗血報告</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">檢驗日期</span>
          <input
            type="datetime-local"
            {...register('recordedAt')}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
          {errors.recordedAt && <p className="text-sm text-red-600">{errors.recordedAt.message as string}</p>}
        </label>

        <FieldSection
          title="生化"
          fields={BIOCHEM_FIELDS}
          open={openSection === 'biochem'}
          onToggle={() => setOpenSection(openSection === 'biochem' ? null : 'biochem')}
          register={register}
          errors={errors}
        />
        <FieldSection
          title="CBC 血球"
          fields={CBC_FIELDS}
          open={openSection === 'cbc'}
          onToggle={() => setOpenSection(openSection === 'cbc' ? null : 'cbc')}
          register={register}
          errors={errors}
        />

        {mutation.isError && <p className="text-sm font-medium text-red-600">記錄失敗,請重試</p>}

        <button
          type="submit"
          disabled={isCatLoading || !catId || mutation.isPending}
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

function FieldSection({
  title,
  fields,
  open,
  onToggle,
  register,
  errors,
}: {
  title: string;
  fields: BloodworkField[];
  open: boolean;
  onToggle: () => void;
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex flex-col divide-y divide-gray-50">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1 px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-600">{field.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="—"
                    {...register(field.key as keyof FormValues)}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                  />
                  {field.unit && <span className="text-xs text-gray-400">{field.unit}</span>}
                </div>
              </div>
              {errors[field.key as keyof FormValues] && (
                <p className="text-right text-xs text-red-600">
                  {(errors[field.key as keyof FormValues]?.message as string) ?? '請輸入數字'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
