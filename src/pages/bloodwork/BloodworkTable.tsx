import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdBloodworkRecords } from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { formatGroupLabel, formatTime } from '@/lib/date';

/**
 * `/bloodwork/table` — 票 23：驗血歷史列表，先前只能在剛建立紀錄後導向單筆詳情頁
 * （`/bloodwork/:id`），沒有回頭瀏覽全部紀錄的入口。比照 `FluidInjectionTable` 的簡單列表模式，
 * 額外加上 checkbox 多選——票 23 要求「取得建議」要能一次選多筆驗血紀錄做趨勢分析（票 22 的
 * 多對多資料模型），這裡是唯一能做多選的地方，單筆觸發則在 `BloodworkDetail`。
 */
export function BloodworkTable() {
  const navigate = useNavigate();
  const { catId, isLoading: isCatLoading, isError: isCatError, refetch: refetchCat } = useCurrentCat();
  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1CatCareCatsCatIdBloodworkRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sorted = useMemo(
    () => [...(records ?? [])].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
    [records],
  );

  const groups = useMemo(() => {
    const ordered: { label: string; items: typeof sorted }[] = [];
    for (const record of sorted) {
      const label = formatGroupLabel(record.recordedAt);
      const last = ordered[ordered.length - 1];
      if (last && last.label === label) {
        last.items.push(record);
      } else {
        ordered.push({ label, items: [record] });
      }
    }
    return ordered;
  }, [sorted]);

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  }

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (isCatError || isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8">
        <p className="text-sm font-medium text-red-600">載入失敗</p>
        <RetryButton onRetry={() => (isCatError ? refetchCat() : refetch())} />
      </div>
    );
  }

  if (!catId) {
    return <div className="px-4 py-6 text-sm text-gray-500">尚未加入任何貓咪</div>;
  }

  if (sorted.length === 0) {
    return <EmptyState icon="🩸" text="還沒有驗血紀錄" ctaLabel="回首頁記一筆" ctaHref="/" />;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-24">
      <h1 className="text-base font-semibold text-gray-900">驗血歷史</h1>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400">{group.label}</p>
            <ul className="flex flex-col gap-2">
              {group.items.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    aria-label="選取這筆驗血紀錄"
                    checked={selectedIds.includes(record.id)}
                    onChange={() => toggleSelected(record.id)}
                    className="h-5 w-5 shrink-0 rounded border-gray-300"
                  />
                  <Link to={`/bloodwork/${record.id}`} className="flex flex-1 items-center gap-3">
                    <span className="text-sm text-gray-900">{formatTime(record.recordedAt)}</span>
                    {record.status === 'draft' ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        草稿・待確認
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        已確認
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-sm text-gray-400">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3">
          <p className="text-sm text-gray-600">已選 {selectedIds.length} 筆</p>
          <button
            type="button"
            onClick={() => navigate('/bloodwork/health-advice', { state: { bloodworkRecordIds: selectedIds } })}
            className="min-h-[44px] rounded-full bg-gray-900 px-5 text-sm font-semibold text-white"
          >
            取得建議
          </button>
        </div>
      )}
    </div>
  );
}
