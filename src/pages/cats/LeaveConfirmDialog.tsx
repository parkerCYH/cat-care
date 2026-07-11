import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface LeaveConfirmDialogProps {
  open: boolean;
  catId: string;
  errorMessage: string | null;
  /** Whether a "前往轉移" shortcut should be offered — false when leaving would orphan
   * the cat (no other member exists to transfer to), per the issue #9 resolution. */
  canTransfer: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Purpose-built leave-confirm dialog for issue #9's 409 handling. The shared
 * `ConfirmDialog` (src/components/ConfirmDialog.tsx) has no slot for injecting extra
 * content (no `children` prop, fixed title/description-only body), so it can't render an
 * inline error message plus a "go transfer custodian" shortcut inside the same dialog as
 * required by the resolution comment ("直接在退出確認對話框裡顯示對應錯誤訊息…提供按鈕導向
 * 轉移晶片登記人頁面"). Per the task boundary (extend usage, don't modify the shared
 * component) this is a standalone dialog mirroring ConfirmDialog's markup/behavior instead.
 */
export function LeaveConfirmDialog({
  open,
  catId,
  errorMessage,
  canTransfer,
  isPending,
  onConfirm,
  onCancel,
}: LeaveConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="w-[calc(100%-2rem)] max-w-sm rounded-xl p-0 backdrop:bg-black/40"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold text-gray-900">退出共同照護</h2>
        <p className="mt-2 text-sm text-gray-600">確定要退出這隻貓咪的共同照護嗎?</p>

        {errorMessage && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
            {canTransfer && (
              <button
                type="button"
                onClick={() => navigate(`/cats/${catId}/transfer-chip`)}
                className="mt-2 text-sm font-medium text-red-700 underline"
              >
                前往轉移晶片登記人
              </button>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? '處理中…' : '確定退出'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
