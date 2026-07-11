import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdBowelMovements } from '@/api/generated/cat-care/cat-care';
import type { GetApiV1CatCareCatsCatIdBowelMovements200Item } from '@/api/generated/model';
import { useCurrentCat } from '@/hooks/useCurrentCat';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatStoolType } from '@/lib/stoolType';
import { addMonths, endOfMonth, formatTime, isSameDay, startOfMonth, toDateParam } from '@/lib/date';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * /bowel/calendar — default entry point for 排便歷史 (issue #7 resolution: calendar is the
 * 預設 view). Standard month grid; a day's dot is red if any record that day is abnormal,
 * green if all normal, absent if no records. Tapping a day opens an inline tooltip/panel
 * with that day's records — no per-row abnormal highlighting inside it (dot color already
 * carries that per the resolution comment). No infinite scroll — one month at a time.
 */
export function BowelCalendar() {
  const { catId, isLoading: isCatLoading, isError: isCatError, refetch: refetchCat } = useCurrentCat();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const from = toDateParam(startOfMonth(monthAnchor));
  const to = toDateParam(endOfMonth(monthAnchor));

  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1CatCareCatsCatIdBowelMovements(catId ?? '', { from, to }, { query: { enabled: !!catId } });

  const recordsByDay = useMemo(() => {
    const map = new Map<string, GetApiV1CatCareCatsCatIdBowelMovements200Item[]>();
    for (const record of records ?? []) {
      const day = record.recordedAt.slice(0, 10);
      const existing = map.get(day) ?? [];
      existing.push(record);
      map.set(day, existing);
    }
    return map;
  }, [records]);

  const days = useMemo(() => {
    const first = startOfMonth(monthAnchor);
    const last = endOfMonth(monthAnchor);
    const leadingBlanks = first.getDay();
    const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), d));
    }
    return cells;
  }, [monthAnchor]);

  const selectedDayRecords = selectedDate
    ? (recordsByDay.get(toDateParam(selectedDate)) ?? [])
    : [];

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
        <Link to="/bowel/table" className="text-sm font-medium text-gray-600 underline">
          切換表格檢視
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="上個月"
          onClick={() => {
            setMonthAnchor((m) => addMonths(m, -1));
            setSelectedDate(null);
          }}
          className="flex h-10 w-10 items-center justify-center text-xl"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {monthAnchor.getFullYear()} / {String(monthAnchor.getMonth() + 1).padStart(2, '0')}
        </span>
        <button
          type="button"
          aria-label="下個月"
          onClick={() => {
            setMonthAnchor((m) => addMonths(m, 1));
            setSelectedDate(null);
          }}
          className="flex h-10 w-10 items-center justify-center text-xl"
        >
          ›
        </button>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-sm font-medium text-red-600">載入失敗</p>
          <RetryButton onRetry={() => refetch()} />
        </div>
      )}

      {!isError && (
        <>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-xs font-medium text-gray-400">
                {label}
              </div>
            ))}
            {days.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} />;
              const dayRecords = recordsByDay.get(toDateParam(day)) ?? [];
              const hasAbnormal = dayRecords.some((r) => r.isAbnormal);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  disabled={isLoading}
                  className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-sm ${
                    isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <span>{day.getDate()}</span>
                  {dayRecords.length > 0 && (
                    <span
                      aria-label={hasAbnormal ? '有異常紀錄' : '皆正常'}
                      className={`h-1.5 w-1.5 rounded-full ${hasAbnormal ? 'bg-red-600' : 'bg-green-600'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedDate.getFullYear()}/{String(selectedDate.getMonth() + 1).padStart(2, '0')}/
                  {String(selectedDate.getDate()).padStart(2, '0')}
                </p>
                <button
                  type="button"
                  aria-label="關閉"
                  onClick={() => setSelectedDate(null)}
                  className="text-sm text-gray-400"
                >
                  ✕
                </button>
              </div>

              {selectedDayRecords.length === 0 ? (
                <p className="text-sm text-gray-500">當天無紀錄</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {selectedDayRecords.map((record) => (
                    <li key={record.id}>
                      <Link
                        to={`/bowel/${record.id}`}
                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            record.isAbnormal ? 'bg-red-600' : 'bg-green-600'
                          }`}
                        />
                        <span className="text-sm text-gray-900">{formatTime(record.recordedAt)}</span>
                        <span className="text-sm text-gray-600">{formatStoolType(record.stoolType)}</span>
                        {record.notes && <span className="ml-auto text-sm text-gray-400">📝</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
