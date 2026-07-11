import { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use for destructive confirmations (delete/archive/leave) — styles the confirm button red. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Routing convention (issue #4 resolution): a pure yes/no confirmation with no input field
 * is a dialog, not a standalone route — use this component for things like "刪除排便紀錄",
 * "封存貓咪", "退出共同照護". Anything that collects input (a form field, a date picker,
 * etc.) should instead be its own route under src/routes, wired into router.tsx.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '確定',
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white ${
              danger ? 'bg-red-600' : 'bg-gray-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
