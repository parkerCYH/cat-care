import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetApiV1CatCareCats, usePostApiV1CatCareCatsCatIdBowelMovements } from '@/api/generated/cat-care/cat-care';
import type { PostApiV1CatCareCatsCatIdBowelMovementsBodyStoolType } from '@/api/generated/model';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useConfirmBackNavigation } from '@/hooks/useConfirmBackNavigation';
import { STOOL_TYPE_LABELS, STOOL_TYPE_OPTIONS } from '@/lib/stoolType';

/**
 * `/bowel/new` — reached via Home's single 記一筆排便 button (issue #6). Since the user is
 * deliberately here to fill in fields, this submits normally (wait for the mutation, show
 * pending/error state) rather than optimistic-navigate.
 */
export function BowelNew() {
  const navigate = useNavigate();
  const catsQuery = useGetApiV1CatCareCats();
  const catId = catsQuery.data?.find((cat) => !cat.archivedAt)?.id;

  const [recordedAt, setRecordedAt] = useState(() => toLocalInputValue(new Date()));
  const [stoolType, setStoolType] = useState<PostApiV1CatCareCatsCatIdBowelMovementsBodyStoolType | undefined>(
    undefined,
  );
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [notes, setNotes] = useState('');

  const { pendingLeave, confirmLeave, cancelLeave } = useConfirmBackNavigation(true);

  const mutation = usePostApiV1CatCareCatsCatIdBowelMovements({
    mutation: {
      onSuccess: () => navigate('/', { replace: true }),
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catId) return;
    mutation.mutate({
      catId,
      data: {
        recordedAt: new Date(recordedAt).toISOString(),
        stoolType,
        isAbnormal,
        notes: notes.trim() || undefined,
      },
    });
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-5 text-lg font-semibold text-gray-900">記一筆排便</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">時間</span>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">形狀</span>
          <div className="flex flex-wrap gap-2">
            {STOOL_TYPE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStoolType(option === stoolType ? undefined : option)}
                aria-pressed={stoolType === option}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  stoolType === option
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {STOOL_TYPE_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">異常</span>
          <input
            type="checkbox"
            checked={isAbnormal}
            onChange={(e) => setIsAbnormal(e.target.checked)}
            className="h-6 w-6 accent-red-600"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">備註</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </label>

        {mutation.isError && (
          <p className="text-sm font-medium text-red-600">記錄失敗,請重試</p>
        )}

        <button
          type="submit"
          disabled={!catId || mutation.isPending}
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

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
