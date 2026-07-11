import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetApiV1CatCareCats,
  useGetApiV1CatCareCatsCatIdBowelMovements,
  useGetApiV1CatCareCatsCatIdWeightRecords,
  usePostApiV1CatCareCatsCatIdBowelMovements,
} from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { STOOL_TYPE_LABELS } from '@/lib/stoolType';
import { WEIGHT_METHOD_LABELS } from '@/lib/weightMethod';

/**
 * Home / quick-record page (issue #6 resolution).
 *
 * Layout top to bottom: top bar (rendered by AppLayout, not here) → two full-width quick
 * record buttons → recent-record summary (today/yesterday, latest bowel + latest weight
 * only — max 4 lines).
 *
 * "Current cat" seam: CatSwitcher (src/components/layout/CatSwitcher.tsx) is still a stub
 * per issue #9 and intentionally not wired up here. This page fetches the cat list itself
 * and uses the first non-archived cat, which also gives us the "no cats yet" signal needed
 * for the empty state below.
 */
export function Home() {
  const navigate = useNavigate();
  const catsQuery = useGetApiV1CatCareCats();

  if (catsQuery.isLoading) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-gray-400">載入中…</p>
      </div>
    );
  }

  if (catsQuery.isError) {
    return (
      <div className="px-4 py-6">
        <p className="mb-2 text-sm text-gray-500">貓咪資料載入失敗</p>
        <RetryButton onRetry={() => catsQuery.refetch()} label="點擊重試" />
      </div>
    );
  }

  const cats = catsQuery.data ?? [];
  const currentCat = cats.find((cat) => !cat.archivedAt);

  if (!currentCat) {
    return (
      <EmptyState
        icon="🐱"
        text="還沒有任何貓咪"
        ctaLabel="+ 新增貓咪"
        ctaHref="/cats/new"
      />
    );
  }

  return <HomeContent catId={currentCat.id} navigate={navigate} />;
}

function HomeContent({
  catId,
  navigate,
}: {
  catId: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [bowelState, setBowelState] = useState<'idle' | 'saved' | 'error'>('idle');

  // Recent-record summary: scope the fetch to the last two calendar days so we don't pull
  // full history just to show one line each (issue #6: "今天/昨天各只顯示每種類型最新一筆").
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const from = toDateOnly(yesterday);
  const to = toDateOnly(today);

  const bowelHistoryQuery = useGetApiV1CatCareCatsCatIdBowelMovements(catId, { from, to });
  const weightHistoryQuery = useGetApiV1CatCareCatsCatIdWeightRecords(catId, { from, to });

  const bowelMutation = usePostApiV1CatCareCatsCatIdBowelMovements({
    mutation: {
      onSuccess: () => {
        setBowelState('saved');
        bowelHistoryQuery.refetch();
      },
      onError: () => setBowelState('error'),
    },
  });

  function recordBowelQuick() {
    setBowelState('saved');
    bowelMutation.mutate({
      catId,
      data: {
        recordedAt: new Date().toISOString(),
        isAbnormal: false,
      },
    });
  }

  const bowelRows = buildBowelRows(today, yesterday, bowelHistoryQuery.data);
  const weightRows = buildWeightRows(today, yesterday, weightHistoryQuery.data);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex min-h-[72px] w-full items-center justify-between rounded-xl bg-gray-900 px-5 py-4 text-white">
          <button
            type="button"
            onClick={recordBowelQuick}
            className="flex-1 text-left text-lg font-semibold"
          >
            {bowelState === 'saved' ? '已記錄 ✓' : '記一筆排便'}
          </button>
          {bowelState === 'error' && (
            <RetryButton
              onRetry={() => {
                setBowelState('saved');
                bowelMutation.mutate({
                  catId,
                  data: { recordedAt: new Date().toISOString(), isAbnormal: false },
                });
              }}
              label="記錄失敗,點擊重試"
              isPending={bowelMutation.isPending}
            />
          )}
          <Link
            to="/bowel/new"
            aria-label="調整排便紀錄細節"
            className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white/80"
          >
            ›
          </Link>
        </div>

        <Link
          to="/weight/new"
          className="flex min-h-[72px] w-full items-center rounded-xl border border-gray-900 px-5 py-4 text-lg font-semibold text-gray-900"
        >
          記一筆體重
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-500">最近紀錄</h2>

        <SummaryBlock
          rows={bowelRows}
          emptyText="尚無排便紀錄"
          onClick={() => navigate('/bowel/table')}
        />
        <SummaryBlock
          rows={weightRows}
          emptyText="尚無體重紀錄"
          onClick={() => navigate('/weight/table')}
        />
      </div>
    </div>
  );
}

/** One tappable summary card per record type — tapping goes to that type's history list
 * (issue #6: "點擊整個區塊導向對應歷史列表頁"). Split by type rather than one merged card
 * so "corresponding history page" is unambiguous when both today+yesterday rows are shown. */
function SummaryBlock({
  rows,
  emptyText,
  onClick,
}: {
  rows: SummaryRow[];
  emptyText: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true">{row.icon}</span>
            <span className="text-gray-500">{row.time}</span>
            <span className={row.abnormal ? 'font-medium text-red-600' : 'text-gray-900'}>
              {row.label}
            </span>
          </div>
        ))
      )}
    </button>
  );
}

function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface SummaryRow {
  key: string;
  icon: string;
  time: string;
  label: string;
  abnormal: boolean;
}

function buildBowelRows(
  today: Date,
  yesterday: Date,
  records: { recordedAt: string; stoolType?: string | null; isAbnormal: boolean }[] | undefined,
): SummaryRow[] {
  const rows: SummaryRow[] = [];

  for (const [dayLabel, day] of [
    ['今天', today],
    ['昨天', yesterday],
  ] as const) {
    const latest = (records ?? [])
      .filter((r) => isSameDay(new Date(r.recordedAt), day))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

    if (!latest) continue;

    const stoolLabel = latest.stoolType
      ? STOOL_TYPE_LABELS[latest.stoolType as keyof typeof STOOL_TYPE_LABELS]
      : '未紀錄形狀';
    rows.push({
      key: `bowel-${dayLabel}`,
      icon: '💩',
      time: `${dayLabel} ${formatTime(latest.recordedAt)}`,
      label: `${stoolLabel}${latest.isAbnormal ? '(異常)' : ''}`,
      abnormal: latest.isAbnormal,
    });
  }

  return rows;
}

function buildWeightRows(
  today: Date,
  yesterday: Date,
  records: { measuredAt: string; weightGrams: number; method?: string | null }[] | undefined,
): SummaryRow[] {
  const rows: SummaryRow[] = [];

  for (const [dayLabel, day] of [
    ['今天', today],
    ['昨天', yesterday],
  ] as const) {
    const latest = (records ?? [])
      .filter((r) => isSameDay(new Date(r.measuredAt), day))
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];

    if (!latest) continue;

    const methodLabel = latest.method
      ? WEIGHT_METHOD_LABELS[latest.method as keyof typeof WEIGHT_METHOD_LABELS]
      : '';
    rows.push({
      key: `weight-${dayLabel}`,
      icon: '⚖️',
      time: `${dayLabel} ${formatTime(latest.measuredAt)}`,
      label: `${(latest.weightGrams / 1000).toFixed(2)} kg${methodLabel ? ` · ${methodLabel}` : ''}`,
      abnormal: false,
    });
  }

  return rows;
}
