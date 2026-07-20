import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdFluidInjections } from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { formatFluidType, formatSite, formatVolume } from '@/lib/fluidInjection';
import { formatTime, formatGroupLabel } from '@/lib/date';

/**
 * `/fluid-injection/table` — 獨立歷史頁(票 04),比照 `WeightTablePage` 的簡單列表模式:單一數量型
 * 紀錄,不像排便紀錄需要「是否異常」篩選,直接依時間排序全部顯示,點列導向 `/fluid-injection/:id`。
 */
export function FluidInjectionTable() {
  const { catId, isLoading: isCatLoading, isError: isCatError, refetch: refetchCat } = useCurrentCat();
  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1CatCareCatsCatIdFluidInjections(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const sorted = useMemo(
    () => [...(records ?? [])].sort((a, b) => new Date(b.injectedAt).getTime() - new Date(a.injectedAt).getTime()),
    [records],
  );

  const groups = useMemo(() => {
    const ordered: { label: string; items: typeof sorted }[] = [];
    for (const record of sorted) {
      const label = formatGroupLabel(record.injectedAt);
      const last = ordered[ordered.length - 1];
      if (last && last.label === label) {
        last.items.push(record);
      } else {
        ordered.push({ label, items: [record] });
      }
    }
    return ordered;
  }, [sorted]);

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
    return <EmptyState icon="💉" text="還沒有點滴紀錄" ctaLabel="回首頁記一筆" ctaHref="/" />;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h1 className="text-base font-semibold text-gray-900">點滴歷史</h1>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400">{group.label}</p>
            <ul className="flex flex-col gap-2">
              {group.items.map((record) => (
                <li key={record.id}>
                  <Link
                    to={`/fluid-injection/${record.id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
                  >
                    <span className="text-sm text-gray-900">{formatTime(record.injectedAt)}</span>
                    <span className="text-sm text-gray-600">{formatSite(record.site, record.siteOther)}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatVolume(record.volumeMl)}</span>
                    <span className="ml-auto shrink-0 text-sm text-gray-400">
                      {formatFluidType(record.fluidType, record.fluidTypeOther)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
