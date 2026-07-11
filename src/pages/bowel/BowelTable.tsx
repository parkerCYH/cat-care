import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdBowelMovements } from '@/api/generated/cat-care/cat-care';
import type { GetApiV1CatCareCatsCatIdBowelMovements200Item } from '@/api/generated/model';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatStoolType } from '@/lib/stoolType';
import { addDays, formatGroupLabel, formatTime, toDateParam } from '@/lib/date';

type AbnormalFilter = 'all' | 'abnormal' | 'normal';

const PAGE_SIZE = 20;

/**
 * /bowel/table — filterable list view (issue #7 resolution). `from`/`to` are real backend
 * query params; "是否異常" is deliberately NOT a backend param — filtered client-side with
 * `.filter()` since data volume is small (see wayfinder map Notes). Grouped by
 * 今天/昨天/實際日期, infinite-scroll revealed since a filtered range can still be long.
 */
export function BowelTable() {
  const { catId, isLoading: isCatLoading, isError: isCatError, refetch: refetchCat } = useCurrentCat();
  const [abnormalFilter, setAbnormalFilter] = useState<AbnormalFilter>('all');
  const [fromDate, setFromDate] = useState(() => toDateParam(addDays(new Date(), -29)));
  const [toDate, setToDate] = useState(() => toDateParam(new Date()));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1CatCareCatsCatIdBowelMovements(
    catId ?? '',
    { from: fromDate, to: toDate },
    { query: { enabled: !!catId } },
  );

  const filteredSorted = useMemo(() => {
    const filtered = (records ?? []).filter((r: GetApiV1CatCareCatsCatIdBowelMovements200Item) => {
      if (abnormalFilter === 'abnormal') return r.isAbnormal;
      if (abnormalFilter === 'normal') return !r.isAbnormal;
      return true;
    });
    return [...filtered].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
  }, [records, abnormalFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [abnormalFilter, fromDate, toDate]);

  const visible = filteredSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSorted.length;

  const groups = useMemo(() => {
    const ordered: { label: string; items: GetApiV1CatCareCatsCatIdBowelMovements200Item[] }[] = [];
    for (const record of visible) {
      const label = formatGroupLabel(record.recordedAt);
      const last = ordered[ordered.length - 1];
      if (last && last.label === label) {
        last.items.push(record);
      } else {
        ordered.push({ label, items: [record] });
      }
    }
    return ordered;
  }, [visible]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((c) => c + PAGE_SIZE);
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  if (isCatLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (isCatError) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8">
        <p className="text-sm font-medium text-red-600">載入失敗</p>
        <RetryButton onRetry={() => refetchCat()} />
      </div>
    );
  }

  if (!catId) {
    return <div className="px-4 py-6 text-sm text-gray-500">尚未加入任何貓咪</div>;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">排便歷史</h1>
        <Link to="/bowel/calendar" className="text-sm font-medium text-gray-600 underline">
          切換日曆檢視
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="flex gap-2">
          {(
            [
              { value: 'all', label: '全部' },
              { value: 'abnormal', label: '僅異常' },
              { value: 'normal', label: '僅正常' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAbnormalFilter(opt.value)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${
                abnormalFilter === opt.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="date"
            aria-label="起始日期"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5"
          />
          <span>–</span>
          <input
            type="date"
            aria-label="結束日期"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5"
          />
        </div>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-sm font-medium text-red-600">載入失敗</p>
          <RetryButton onRetry={() => refetch()} />
        </div>
      )}

      {!isError && !isLoading && filteredSorted.length === 0 && (
        <EmptyState icon="🐾" text="這段期間沒有排便紀錄" ctaLabel="回首頁記一筆" ctaHref="/" />
      )}

      {!isError && groups.length > 0 && (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-400">{group.label}</p>
              <ul className="flex flex-col gap-2">
                {group.items.map((record) => (
                  <li key={record.id}>
                    <Link
                      to={`/bowel/${record.id}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
                    >
                      <span
                        aria-label={record.isAbnormal ? '異常' : '正常'}
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          record.isAbnormal ? 'bg-red-600' : 'bg-green-600'
                        }`}
                      />
                      <span className="text-sm text-gray-900">{formatTime(record.recordedAt)}</span>
                      <span className="text-sm text-gray-600">{formatStoolType(record.stoolType)}</span>
                      {record.notes && (
                        <span className="ml-auto shrink-0 text-sm text-gray-400" aria-label="有備註">
                          📝
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {hasMore && <div ref={sentinelRef} className="h-4" />}
        </div>
      )}
    </div>
  );
}
