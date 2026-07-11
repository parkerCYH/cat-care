export interface RetryButtonProps {
  onRetry: () => void;
  /** e.g. "點擊重試" — text is what distinguishes this from an "異常" state, not color. */
  label?: string;
  isPending?: boolean;
}

/**
 * "待重試" — transient/button variant (issue #11). For inline, momentary feedback such as a
 * home quick-record button: shows red text once a mutation fails, disappears once it
 * succeeds. Always red per the shared color rule (no separate color for "異常" vs "待重試" —
 * only the label text differs). For the persistent, list-row version see RetryListItem.
 */
export function RetryButton({ onRetry, label = '點擊重試', isPending = false }: RetryButtonProps) {
  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={isPending}
      className="text-sm font-medium text-red-600 underline decoration-red-300 underline-offset-2 disabled:opacity-50"
    >
      {isPending ? '重試中…' : label}
    </button>
  );
}
