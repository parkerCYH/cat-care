import { useState } from 'react';
import { BIOCHEM_FIELDS, CBC_FIELDS, mockDraftValues } from './fields';

type Method = 'photo' | 'manual' | null;

/**
 * Variant C — 密集表格（資料輸入取向）。入口是健康紀錄列表裡的一列，記錄頁本身用單一密集
 * 兩欄表格呈現全部 34 欄位（分組用 sticky 子標題），拍照辨識時表格本身顯示 skeleton + 頂部
 * 細進度條，不另開等待畫面；read-only/edit 是表格上方單一全域開關，一次切換全部欄位。
 */
export function VariantC() {
  const [entered, setEntered] = useState(false);
  const [method, setMethod] = useState<Method>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'draft' | 'confirmed'>('draft');
  const [mode, setMode] = useState<'readonly' | 'edit'>('readonly');
  const [values, setValues] = useState<Record<string, string>>({});

  function selectMethod(next: Exclude<Method, null>) {
    setMethod(next);
    setStatus('draft');
    if (next === 'photo') {
      setLoading(true);
      setValues({});
      setMode('readonly');
    } else {
      setLoading(false);
      setValues({});
      setMode('edit');
    }
  }

  function finishLoading() {
    setValues(mockDraftValues());
    setLoading(false);
  }

  function confirm() {
    setStatus('confirmed');
    setMode('readonly');
  }

  if (!entered) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold text-gray-900">健康紀錄</h1>
        <ul className="flex flex-col gap-2">
          <li>
            <button
              type="button"
              onClick={() => setEntered(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-left text-gray-500"
            >
              <span className="text-lg">＋</span>
              <span className="text-sm font-medium">新增驗血報告</span>
            </button>
          </li>
          <li className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 opacity-50">
            <span className="text-sm text-gray-900">2026-06-26</span>
            <span className="text-sm text-gray-500">驗血報告</span>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-28">
      <button type="button" onClick={() => setEntered(false)} className="mb-3 text-sm text-gray-400">
        ← 返回健康紀錄
      </button>
      <h1 className="mb-3 text-lg font-semibold text-gray-900">新增驗血報告</h1>

      <div className="mb-4 flex rounded-full border border-gray-300 p-1">
        <button
          type="button"
          onClick={() => selectMethod('photo')}
          className={`flex-1 rounded-full py-2 text-sm font-medium ${
            method === 'photo' ? 'bg-gray-900 text-white' : 'text-gray-600'
          }`}
        >
          📷 拍照辨識
        </button>
        <button
          type="button"
          onClick={() => selectMethod('manual')}
          className={`flex-1 rounded-full py-2 text-sm font-medium ${
            method === 'manual' ? 'bg-gray-900 text-white' : 'text-gray-600'
          }`}
        >
          ✍️ 手動填寫
        </button>
      </div>

      {method && (
        <>
          {loading && (
            <div className="mb-2 flex items-center justify-between">
              <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D85A30]" />
              </div>
              <button type="button" onClick={finishLoading} className="ml-3 shrink-0 text-xs text-[#D85A30] underline">
                （prototype）模擬完成
              </button>
            </div>
          )}

          {!loading && status === 'draft' && (
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {method === 'photo' ? '草稿・AI 辨識結果' : '草稿・手動填寫'}
              </span>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                唯讀
                <button
                  type="button"
                  role="switch"
                  aria-checked={mode === 'edit'}
                  onClick={() => setMode(mode === 'readonly' ? 'edit' : 'readonly')}
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${mode === 'edit' ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${mode === 'edit' ? 'translate-x-4' : ''}`}
                  />
                </button>
                編輯
              </label>
            </div>
          )}

          {status === 'confirmed' && (
            <span className="mb-2 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              已確認
            </span>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-100">
            <DataRows title="生化" fields={BIOCHEM_FIELDS} values={values} mode={status === 'confirmed' ? 'readonly' : mode} loading={loading} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} />
            <DataRows title="CBC 血球" fields={CBC_FIELDS} values={values} mode={status === 'confirmed' ? 'readonly' : mode} loading={loading} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} />
          </div>

          {status === 'draft' && !loading && (
            <button
              type="button"
              onClick={confirm}
              className="fixed inset-x-4 bottom-20 min-h-[48px] rounded-full bg-gray-900 text-base font-semibold text-white"
            >
              確認送出
            </button>
          )}
        </>
      )}
    </div>
  );
}

function DataRows({
  title,
  fields,
  values,
  mode,
  loading,
  onChange,
}: {
  title: string;
  fields: { key: string; label: string; unit: string }[];
  values: Record<string, string>;
  mode: 'readonly' | 'edit';
  loading: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">{title}</div>
      <div className="flex flex-col divide-y divide-gray-50">
        {fields.map((f) => (
          <div key={f.key} className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-2 px-3 py-1.5">
            <span className="truncate text-xs text-gray-600">{f.label}</span>
            {loading ? (
              <div className="h-5 rounded bg-gray-100" />
            ) : mode === 'edit' ? (
              <input
                type="text"
                inputMode="decimal"
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full rounded border border-gray-300 px-1.5 py-0.5 text-right text-xs"
              />
            ) : (
              <span className="text-right text-xs font-medium text-gray-900">
                {values[f.key] ?? <span className="text-gray-300">—</span>}
              </span>
            )}
            <span className="text-[10px] text-gray-400">{f.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
