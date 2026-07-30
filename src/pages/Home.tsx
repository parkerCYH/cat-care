import { Link, useNavigate } from 'react-router-dom';
import {
  useGetApiV1CatCareCatsCatIdBowelMovements,
  useGetApiV1CatCareCatsCatIdFluidInjections,
  useGetApiV1CatCareCatsCatIdWeightRecords,
} from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { STOOL_TYPE_LABELS } from '@/lib/stoolType';
import { WEIGHT_METHOD_LABELS } from '@/lib/weightMethod';
import { formatSite, formatVolume } from '@/lib/fluidInjection';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { formatKg } from '@/pages/weight/weightShared';

/**
 * Home / quick-record page (issue #6 resolution).
 *
 * Layout top to bottom: top bar (rendered by AppLayout, not here) → two full-width quick
 * record buttons → recent-record summary (today/yesterday, latest bowel + latest weight
 * only — max 4 lines).
 *
 * "Current cat" seam (phase-2 integration, issue #10): resolved via the shared
 * `useCurrentCat` hook (backed by `currentCatStore`) rather than fetching `/cats` and
 * picking the first non-archived cat locally — this page also doubles as the "no cats
 * yet" empty-state signal below.
 */
export function Home() {
  const navigate = useNavigate();
  const currentCat = useCurrentCat();

  if (currentCat.isLoading) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-gray-400">載入中…</p>
      </div>
    );
  }

  if (currentCat.isError) {
    return (
      <div className="px-4 py-6">
        <p className="mb-2 text-sm text-gray-500">貓咪資料載入失敗</p>
        <RetryButton onRetry={() => currentCat.refetch()} label="點擊重試" />
      </div>
    );
  }

  if (!currentCat.catId) {
    return (
      <EmptyState
        icon="🐱"
        text="還沒有任何貓咪"
        ctaLabel="+ 新增貓咪"
        ctaHref="/cats/new"
      />
    );
  }

  return <HomeContent catId={currentCat.catId} navigate={navigate} />;
}

function HomeContent({
  catId,
  navigate,
}: {
  catId: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  // Recent-record summary: scope the fetch to the last two calendar days so we don't pull
  // full history just to show one line each (issue #6: "今天/昨天各只顯示每種類型最新一筆").
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const from = toDateOnly(yesterday);
  const to = toDateOnly(today);

  const bowelHistoryQuery = useGetApiV1CatCareCatsCatIdBowelMovements(catId, { from, to });
  const weightHistoryQuery = useGetApiV1CatCareCatsCatIdWeightRecords(catId, { from, to });
  const fluidInjectionHistoryQuery = useGetApiV1CatCareCatsCatIdFluidInjections(catId, { from, to });

  const bowelRows = buildBowelRows(today, yesterday, bowelHistoryQuery.data);
  const weightRows = buildWeightRows(today, yesterday, weightHistoryQuery.data);
  const fluidInjectionRows = buildFluidInjectionRows(today, yesterday, fluidInjectionHistoryQuery.data);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-3">
        <Link
          to="/bowel/new"
          className="flex min-h-[72px] w-full items-center rounded-xl bg-gray-900 px-5 py-4 text-lg font-semibold text-white"
        >
          記一筆排便
        </Link>

        <Link
          to="/weight/new"
          className="flex min-h-[72px] w-full items-center rounded-xl border border-gray-900 px-5 py-4 text-lg font-semibold text-gray-900"
        >
          記一筆體重
        </Link>

        <Link
          to="/fluid-injection/new"
          className="flex min-h-[72px] w-full items-center rounded-xl border border-gray-900 px-5 py-4 text-lg font-semibold text-gray-900"
        >
          記一筆點滴
        </Link>

        {/* 票 19 — 手動填寫驗血報告(拍照辨識入口留給票 21) */}
        <Link
          to="/bloodwork/new"
          className="flex min-h-[72px] w-full items-center rounded-xl border border-gray-900 px-5 py-4 text-lg font-semibold text-gray-900"
        >
          ✍️ 手動填寫驗血報告
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
        <SummaryBlock
          rows={fluidInjectionRows}
          emptyText="尚無點滴紀錄"
          onClick={() => navigate('/fluid-injection/table')}
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
      label: `${formatKg(latest.weightGrams)}${methodLabel ? ` · ${methodLabel}` : ''}`,
      abnormal: false,
    });
  }

  return rows;
}

function buildFluidInjectionRows(
  today: Date,
  yesterday: Date,
  records:
    | { injectedAt: string; site: string; siteOther?: string | null; volumeMl: number }[]
    | undefined,
): SummaryRow[] {
  const rows: SummaryRow[] = [];

  for (const [dayLabel, day] of [
    ['今天', today],
    ['昨天', yesterday],
  ] as const) {
    const latest = (records ?? [])
      .filter((r) => isSameDay(new Date(r.injectedAt), day))
      .sort((a, b) => new Date(b.injectedAt).getTime() - new Date(a.injectedAt).getTime())[0];

    if (!latest) continue;

    rows.push({
      key: `fluid-injection-${dayLabel}`,
      icon: '💉',
      time: `${dayLabel} ${formatTime(latest.injectedAt)}`,
      label: `${formatSite(latest.site as Parameters<typeof formatSite>[0], latest.siteOther)} · ${formatVolume(latest.volumeMl)}`,
      abnormal: false,
    });
  }

  return rows;
}
