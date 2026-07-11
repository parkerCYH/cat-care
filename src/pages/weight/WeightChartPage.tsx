import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { useGetApiV1CatCareCatsCatIdWeightRecords } from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatDateTime, methodLabel, useCurrentCatId } from './weightShared';

type Range = 'all' | '1m' | '3m';

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '1m', label: '1個月' },
  { value: '3m', label: '3個月' },
];

/**
 * /weight/chart — default landing page for the feature (issue #8 resolution). Fetches the
 * cat's full weight history once; the 全部/1個月/3個月 toggle is a pure client-side filter
 * over that already-fetched data, never a refetch (explicit decision — data volume is small
 * and cached, so the toggle should feel instant).
 */
export function WeightChartPage() {
  const { catId, isLoading: isCatLoading, isError: isCatError } = useCurrentCatId();
  const [range, setRange] = useState<Range>('all');

  const {
    data: records,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetApiV1CatCareCatsCatIdWeightRecords(catId ?? '', undefined, {
    query: { enabled: !!catId },
  });

  const sorted = useMemo(
    () =>
      [...(records ?? [])].sort(
        (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
      ),
    [records],
  );

  const filtered = useMemo(() => {
    if (range === 'all') return sorted;
    const months = range === '1m' ? 1 : 3;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return sorted.filter((record) => new Date(record.measuredAt) >= cutoff);
  }, [sorted, range]);

  const chartData = useMemo(
    () =>
      filtered.map((record) => ({
        measuredAt: record.measuredAt,
        weightKg: Number((record.weightGrams / 1000).toFixed(2)),
        method: record.method,
        notes: record.notes,
      })),
    [filtered],
  );

  if (isCatLoading || isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (isCatError || isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm font-medium text-red-600">讀取失敗</p>
        <RetryButton onRetry={() => refetch()} isPending={isRefetching} />
      </div>
    );
  }

  if (sorted.length === 0) {
    return <EmptyState icon="⚖️" text="還沒有體重紀錄" ctaLabel="回首頁記一筆" ctaHref="/" />;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex justify-end">
        <Link to="/weight/table" className="text-sm font-medium text-gray-600 underline">
          查看表格
        </Link>
      </div>
      <div style={{ height: '55vh' }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="measuredAt"
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
              }
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
              tickFormatter={(value: number) => `${value}kg`}
              tick={{ fontSize: 12 }}
              width={48}
            />
            <Tooltip content={<WeightTooltip />} />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="#111827"
              strokeWidth={2}
              dot={{ r: chartData.length <= 2 ? 4 : 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRange(option.value)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-medium ${
              range === option.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeightTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as {
    measuredAt: string;
    weightKg: number;
    method?: string | null;
    notes?: string | null;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-gray-900">{formatDateTime(point.measuredAt)}</p>
      <p className="text-gray-700">{point.weightKg}kg</p>
      <p className="text-gray-500">
        {methodLabel(point.method as Parameters<typeof methodLabel>[0])}
      </p>
      {point.notes && <p className="mt-1 text-gray-500">{point.notes}</p>}
    </div>
  );
}
