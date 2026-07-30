import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdBloodworkRecords } from '@/api/generated/cat-care/cat-care';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { BIOCHEM_FIELDS, CBC_FIELDS, formatBloodworkValue } from '@/lib/bloodwork';

/**
 * `/bloodwork/:id` — 票 19:手動填寫送出後導向這裡,確認紀錄已建立且 `status: confirmed`
 * (票 19 acceptance criteria)。沒有單筆 GET 端點(比照 fluid-injection 的作法),從列表查詢的
 * 快取結果中找出對應紀錄。唯讀顯示,不含編輯/刪除——手動填寫送出即定案,沒有確認態需要處理
 * (票 13),編輯/刪除 UI 留給之後真的有需求時再開票。
 */
export function BloodworkDetail() {
  const { id } = useParams<{ id: string }>();
  const { catId, isLoading: isCatLoading } = useCurrentCat();

  const { data: records, isLoading } = useGetApiV1CatCareCatsCatIdBloodworkRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const record = useMemo(() => records?.find((item) => item.id === id), [records, id]);

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
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">已確認</span>
      </div>

      <FieldGroup title="生化" fields={BIOCHEM_FIELDS} record={record} />
      <FieldGroup title="CBC 血球" fields={CBC_FIELDS} record={record} />
    </div>
  );
}

function FieldGroup({
  title,
  fields,
  record,
}: {
  title: string;
  fields: { key: string; label: string; unit: string }[];
  record: Record<string, unknown>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">{title}</div>
      <div className="flex flex-col divide-y divide-gray-50">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm text-gray-600">{field.label}</span>
            <span className="text-sm font-medium text-gray-900">
              {formatBloodworkValue(record[field.key] as number | null | undefined, field.unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
