import type { ReactNode } from 'react';

export interface RetryListItemProps {
  /** e.g. "尚未送出,點擊重試" — text distinguishes this from an "異常" row, not color. */
  message: string;
  onRetry: () => void;
  isPending?: boolean;
  /** Optional record summary shown above the retry message (e.g. "排便紀錄 · 07/11 08:30"). */
  children?: ReactNode;
}

/**
 * "待重試" — persistent/list-item variant (issue #11). For bowel/weight history rows: stays
 * visible, with a more prominent warning treatment than RetryButton, until the user
 * successfully retries. Always red per the shared color rule.
 */
export function RetryListItem({ message, onRetry, isPending = false, children }: RetryListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <span className="text-lg text-red-600" aria-hidden="true">
        ⚠️
      </span>
      <div className="flex-1 min-w-0">
        {children && <div className="truncate text-sm text-gray-700">{children}</div>}
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isPending}
        className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-sm font-medium text-red-700 disabled:opacity-50"
      >
        {isPending ? '重試中…' : '重試'}
      </button>
    </div>
  );
}
