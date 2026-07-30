import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getGetApiV1CatCareCatsCatIdBloodworkRecordsQueryKey,
  useGetApiV1CatCareCatsCatIdBloodworkRecords,
  usePatchApiV1CatCareCatsCatIdBloodworkRecordsId,
} from '@/api/generated/cat-care/cat-care';
import { patchApiV1CatCareCatsCatIdBloodworkRecordsIdBody } from '@/api/generated-zod/cat-care/cat-care';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { useCurrentUserId } from '@/lib/currentUser';
import { BIOCHEM_FIELDS, BLOODWORK_FIELDS, CBC_FIELDS, formatBloodworkValue, type BloodworkField } from '@/lib/bloodwork';

// 比照票 19 BloodworkNew 的作法:空字串代表沒填,轉成 undefined 避免 z.coerce.number() 把它
// 強制轉成 0。
const optionalNumberInput = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.coerce.number({ invalid_type_error: '請輸入數字' }).nullish(),
);

// 直接複用票 18 orval 產生的 PATCH zod schema 當底稿,只覆寫 34 個數值欄位的輸入轉型
// (html number input 給字串),不手動重打一份驗證規則。跟票 19 BloodworkNew 一樣在 .extend()
// 物件裡保留至少一個明確的 key(而非整個引數都是 Object.fromEntries 的展開)——單純展開會讓
// TS 把整個 extend 引數推成索引簽名型別,連帶讓 z.infer 之後的 keyof 被拓寬成 `string | number`,
// 導致 register()/reset() 的呼叫端型別檢查失敗。
const confirmFormSchema = patchApiV1CatCareCatsCatIdBloodworkRecordsIdBody.extend({
  status: z.literal('confirmed').optional(),
  ...Object.fromEntries(
    [...BIOCHEM_FIELDS, ...CBC_FIELDS].map((field) => [field.key, optionalNumberInput]),
  ),
});

type ConfirmFormValues = z.infer<typeof confirmFormSchema>;

/**
 * `/bloodwork/:id` — 唯讀顯示 `confirmed` 紀錄(票 19),`draft` 紀錄則走票 09 定案的
 * read-only/edit 兩態確認流程(票 21):AI 辨識完成後先唯讀顯示猜測值,記錄本人可切到 edit
 * 修改任一欄位,「確認送出」呼叫 PATCH 把狀態轉成 `confirmed`(不論有沒有修改欄位,同一次
 * PATCH 可以同時帶欄位修改與狀態轉換)。沒有單筆 GET 端點,從列表查詢的快取結果中找出對應
 * 紀錄(比照 FluidInjectionDetail)。
 */
export function BloodworkDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const currentUserId = useCurrentUserId();
  const [mode, setMode] = useState<'readonly' | 'edit'>('readonly');

  const { data: records, isLoading } = useGetApiV1CatCareCatsCatIdBloodworkRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const record = useMemo(() => records?.find((item) => item.id === id), [records, id]);
  const isOwner = !!currentUserId && !!record && record.recordedBy === currentUserId;
  const isDraft = record?.status === 'draft';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfirmFormValues>({ resolver: zodResolver(confirmFormSchema) });

  useEffect(() => {
    if (!record) return;
    const recordValues = record as unknown as Record<string, number | null | undefined>;
    reset(Object.fromEntries(BIOCHEM_FIELDS.concat(CBC_FIELDS).map((field) => [field.key, recordValues[field.key]])));
  }, [record, reset]);

  const confirmMutation = usePatchApiV1CatCareCatsCatIdBloodworkRecordsId({
    mutation: {
      onSuccess: () => {
        if (catId) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1CatCareCatsCatIdBloodworkRecordsQueryKey(catId),
          });
        }
        setMode('readonly');
      },
    },
  });

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-gray-500">找不到這筆驗血紀錄</p>
        <Link to="/" className="text-sm font-medium text-gray-900 underline">
          回首頁
        </Link>
      </div>
    );
  }

  const recordedAt = new Date(record.recordedAt);
  const fieldMode = isDraft && isOwner ? mode : 'readonly';

  const onConfirm = handleSubmit((values) => {
    if (!catId || !id) return;
    const fieldValues = Object.fromEntries(BLOODWORK_FIELDS.map((field) => [field.key, values[field.key as keyof ConfirmFormValues]]));
    confirmMutation.mutate({ catId, id, data: { ...fieldValues, status: 'confirmed' } });
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">檢驗日期</p>
          <p className="text-base text-gray-900">
            {recordedAt.getFullYear()}/{String(recordedAt.getMonth() + 1).padStart(2, '0')}/
            {String(recordedAt.getDate()).padStart(2, '0')} {String(recordedAt.getHours()).padStart(2, '0')}:
            {String(recordedAt.getMinutes()).padStart(2, '0')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              草稿・待確認
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">已確認</span>
          )}
          {isDraft && isOwner && (
            <button
              type="button"
              onClick={() => setMode(mode === 'readonly' ? 'edit' : 'readonly')}
              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              {mode === 'readonly' ? '編輯' : '完成編輯'}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={onConfirm} className="flex flex-col gap-6">
        <FieldGroup title="生化" fields={BIOCHEM_FIELDS} record={record} mode={fieldMode} register={register} errors={errors} />
        <FieldGroup title="CBC 血球" fields={CBC_FIELDS} record={record} mode={fieldMode} register={register} errors={errors} />

        {confirmMutation.isError && <p className="text-sm font-medium text-red-600">確認失敗,請重試</p>}

        {isDraft && isOwner && (
          <button
            type="submit"
            disabled={confirmMutation.isPending}
            className="min-h-[48px] rounded-full bg-gray-900 text-base font-semibold text-white disabled:opacity-50"
          >
            {confirmMutation.isPending ? '送出中…' : '確認送出'}
          </button>
        )}
      </form>
    </div>
  );
}

function FieldGroup({
  title,
  fields,
  record,
  mode,
  register,
  errors,
}: {
  title: string;
  fields: BloodworkField[];
  record: Record<string, unknown>;
  mode: 'readonly' | 'edit';
  register: ReturnType<typeof useForm<ConfirmFormValues>>['register'];
  errors: ReturnType<typeof useForm<ConfirmFormValues>>['formState']['errors'];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">{title}</div>
      <div className="flex flex-col divide-y divide-gray-50">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1 px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600">{field.label}</span>
              {mode === 'readonly' ? (
                <span className="text-sm font-medium text-gray-900">
                  {formatBloodworkValue(record[field.key] as number | null | undefined, field.unit)}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="—"
                    {...register(field.key as keyof ConfirmFormValues)}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                  />
                  {field.unit && <span className="text-xs text-gray-400">{field.unit}</span>}
                </div>
              )}
            </div>
            {mode === 'edit' && errors[field.key as keyof ConfirmFormValues] && (
              <p className="text-right text-xs text-red-600">
                {(errors[field.key as keyof ConfirmFormValues]?.message as string) ?? '請輸入數字'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
