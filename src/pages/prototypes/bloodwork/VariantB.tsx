import { useState } from 'react';
import { FINE_GROUPS, mockDraftValues } from './fields';

type BannerState = 'none' | 'processing' | 'ready';

/**
 * Variant B — FAB + 背景非同步處理。入口是浮動 + 按鈕（呼應首頁快速記錄按鈕的分量，但用 FAB
 * 而非滿版按鈕），選擇拍照後辨識用「不擋畫面」的頂部橫幅表示，完成後才點開底部抽屜確認；
 * 抽屜內把 34 欄位拆成四張可左右滑動的小卡片，各卡各自切 read-only/edit。
 */
export function VariantB() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState>('none');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState<'draft' | 'confirmed'>('draft');
  const [values, setValues] = useState<Record<string, string>>({});
  const [panelIndex, setPanelIndex] = useState(0);
  const [editingPanel, setEditingPanel] = useState(false);

  function choosePhoto() {
    setSheetOpen(false);
    setBanner('processing');
  }

  function finishProcessing() {
    setBanner('ready');
  }

  function openDrawerFromChip() {
    setValues(mockDraftValues());
    setStatus('draft');
    setEditingPanel(false);
    setPanelIndex(0);
    setDrawerOpen(true);
    setBanner('none');
  }

  function chooseManual() {
    setSheetOpen(false);
    setValues({});
    setStatus('draft');
    setEditingPanel(true);
    setPanelIndex(0);
    setDrawerOpen(true);
  }

  function confirm() {
    setStatus('confirmed');
    setEditingPanel(false);
    setDrawerOpen(false);
  }

  return (
    <div className="relative min-h-[70vh] px-4 py-6 pb-28">
      {/* 假的首頁背景，示意「辨識中仍可留在原本畫面」 */}
      <div className="flex flex-col gap-3 opacity-90">
        <h1 className="text-lg font-semibold text-gray-900">首頁</h1>
        <div className="flex min-h-[72px] w-full items-center rounded-xl bg-gray-900 px-5 py-4 text-lg font-semibold text-white">
          記一筆排便
        </div>
        <div className="flex min-h-[72px] w-full items-center rounded-xl border border-gray-900 px-5 py-4 text-lg font-semibold text-gray-900">
          記一筆體重
        </div>
      </div>

      {banner === 'processing' && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#FAECE7] px-4 py-3">
          <span className="animate-spin text-lg">🩸</span>
          <span className="flex-1 text-sm font-medium text-[#D85A30]">驗血報告辨識中…可以先做別的事</span>
          <button type="button" onClick={finishProcessing} className="text-xs text-[#D85A30] underline">
            （prototype）模擬完成
          </button>
        </div>
      )}

      {banner === 'ready' && (
        <button
          type="button"
          onClick={openDrawerFromChip}
          className="mt-4 flex w-full items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-left"
        >
          <span className="text-lg">✅</span>
          <span className="flex-1 text-sm font-medium text-green-700">驗血報告辨識完成，點此確認</span>
        </button>
      )}

      {/* FAB 入口 */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white shadow-lg"
        aria-label="新增紀錄"
      >
        ＋
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={() => setSheetOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-white p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-center text-sm text-gray-400">新增驗血報告</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={choosePhoto}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-left"
              >
                <span className="text-xl">📷</span>
                <span className="text-sm font-medium text-gray-900">拍照辨識</span>
              </button>
              <button
                type="button"
                onClick={chooseManual}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-left"
              >
                <span className="text-xl">✍️</span>
                <span className="text-sm font-medium text-gray-900">手動填寫</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40">
          {/* mb-16 只是為了不擋住 dev-only 的 PrototypeSwitcher，正式頁面不會有這條浮動列 */}
          <div className="mb-16 flex max-h-[85vh] flex-col rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-medium text-gray-900">
                {status === 'confirmed' ? '已確認的驗血報告' : '確認驗血報告'}
              </span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="text-gray-400">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {panelIndex + 1} / {FINE_GROUPS.length} · {FINE_GROUPS[panelIndex].label}
                </span>
                {status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => setEditingPanel((v) => !v)}
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700"
                  >
                    {editingPanel ? '完成編輯此區' : '編輯此區'}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-gray-100 p-3">
                {FINE_GROUPS[panelIndex].fields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-sm text-gray-600">{f.label}</span>
                    {editingPanel && status === 'draft' ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {values[f.key] ? `${values[f.key]} ${f.unit}` : <span className="text-gray-300">未填寫</span>}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-center gap-1.5">
                {FINE_GROUPS.map((g, i) => (
                  <button
                    key={g.label}
                    type="button"
                    aria-label={g.label}
                    onClick={() => setPanelIndex(i)}
                    className={`h-2 w-2 rounded-full ${i === panelIndex ? 'bg-gray-900' : 'bg-gray-200'}`}
                  />
                ))}
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  disabled={panelIndex === 0}
                  onClick={() => setPanelIndex((i) => Math.max(0, i - 1))}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-30"
                >
                  上一組
                </button>
                <button
                  type="button"
                  disabled={panelIndex === FINE_GROUPS.length - 1}
                  onClick={() => setPanelIndex((i) => Math.min(FINE_GROUPS.length - 1, i + 1))}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-30"
                >
                  下一組
                </button>
              </div>
            </div>

            {status === 'draft' && (
              <div className="border-t border-gray-100 p-4">
                <button
                  type="button"
                  onClick={confirm}
                  className="min-h-[48px] w-full rounded-full bg-gray-900 text-base font-semibold text-white"
                >
                  確認送出
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
