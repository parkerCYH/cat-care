import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * 票 01 定案:偵測到新版本時彈提示,由使用者自己選重整時機,不靜默自動重整(避免中斷表單填寫)。
 * `onOfflineReady` 保持沉默——Phase 0 scope 沒有離線功能訴求,提示會製造不存在的期待。
 */

// 票 03:正常路徑下 controllerchange → reload 應在 1 秒內完成,8 秒是寬鬆上限。
const UPDATE_TIMEOUT_MS = 8000;

export function PwaUpdatePrompt() {
  const [updating, setUpdating] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  const handleUpdate = () => {
    setUpdating(true);

    // 票 03:iOS Safari standalone 模式下 controllerchange 有時不觸發,導致按鈕永久卡在
    // 「更新中…」。到期強制 reload 作為 fallback——使用者已主動點擊過一次,這不是新增未經同意的
    // 自動重整,只是確保這次點擊真的有結果。
    const timeoutId = window.setTimeout(() => window.location.reload(), UPDATE_TIMEOUT_MS);
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.clearTimeout(timeoutId),
      { once: true },
    );

    updateServiceWorker(true);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl bg-[#FAECE7] p-4 shadow-lg">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0997B] text-base"
      >
        🔄
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-medium text-[#4A1B0C]">有新版本可以更新</p>
        <p className="text-xs text-[#993C1D]">重新整理即可套用最新版本</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {updating ? '更新中…' : '立即更新'}
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          disabled={updating}
          className="text-xs font-medium text-[#993C1D] disabled:opacity-50"
        >
          稍後
        </button>
      </div>
    </div>
  );
}
