import { useState } from 'react';
import { BIOCHEM_FIELDS, CBC_FIELDS, mockDraftValues } from './fields';

type Step = 'entry' | 'processing' | 'confirm';

/**
 * Variant A — 單頁精靈（Wizard）。入口是首頁風格的兩個滿版按鈕，辨識中是一張置中卡片，
 * 確認表單是單一長頁、兩個大區塊（生化／CBC）可收合，read-only/edit 用同一份表單切狀態。
 */
export function VariantA() {
  const [step, setStep] = useState<Step>('entry');
  const [status, setStatus] = useState<'draft' | 'confirmed'>('draft');
  const [mode, setMode] = useState<'readonly' | 'edit'>('readonly');
  const [values, setValues] = useState<Record<string, string>>({});
  const [openSection, setOpenSection] = useState<'biochem' | 'cbc' | null>('biochem');

  function startPhoto() {
    setStep('processing');
  }

  function finishProcessing() {
    setValues(mockDraftValues());
    setStatus('draft');
    setMode('readonly');
    setStep('confirm');
  }

  function startManual() {
    setValues({});
    setStatus('draft');
    setMode('edit');
    setStep('confirm');
  }

  function confirm() {
    setStatus('confirmed');
    setMode('readonly');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-28">
      <StepIndicator step={step} />

      {step === 'entry' && (
        <div className="mt-6 flex flex-col gap-3">
          <h1 className="mb-1 text-lg font-semibold text-gray-900">新增驗血報告</h1>
          <button
            type="button"
            onClick={startPhoto}
            className="flex min-h-[72px] w-full flex-col items-center justify-center rounded-xl bg-gray-900 px-5 py-4 text-white"
          >
            <span className="text-2xl">📷</span>
            <span className="mt-1 text-base font-semibold">拍照辨識</span>
          </button>
          <button
            type="button"
            onClick={startManual}
            className="flex min-h-[72px] w-full flex-col items-center justify-center rounded-xl border border-gray-900 px-5 py-4 text-gray-900"
          >
            <span className="text-2xl">✍️</span>
            <span className="mt-1 text-base font-semibold">手動填寫</span>
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl bg-[#FAECE7] px-6 py-10 text-center">
          <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#F0997B] text-3xl">
            🩸
          </div>
          <p className="text-sm font-medium text-[#D85A30]">AI 辨識中，請稍候…</p>
          <button
            type="button"
            onClick={finishProcessing}
            className="mt-2 rounded-full border border-[#D85A30] px-4 py-2 text-xs text-[#D85A30]"
          >
            （prototype）模擬辨識完成
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={status} />
            {status === 'draft' && (
              <button
                type="button"
                onClick={() => setMode(mode === 'readonly' ? 'edit' : 'readonly')}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                {mode === 'readonly' ? '編輯' : '完成編輯'}
              </button>
            )}
          </div>

          <Section
            title="生化"
            open={openSection === 'biochem'}
            onToggle={() => setOpenSection(openSection === 'biochem' ? null : 'biochem')}
            fields={BIOCHEM_FIELDS}
            values={values}
            mode={status === 'confirmed' ? 'readonly' : mode}
            onChange={(key, v) => setValues((prev) => ({ ...prev, [key]: v }))}
          />
          <Section
            title="CBC 血球"
            open={openSection === 'cbc'}
            onToggle={() => setOpenSection(openSection === 'cbc' ? null : 'cbc')}
            fields={CBC_FIELDS}
            values={values}
            mode={status === 'confirmed' ? 'readonly' : mode}
            onChange={(key, v) => setValues((prev) => ({ ...prev, [key]: v }))}
          />

          {status === 'draft' && (
            <button
              type="button"
              onClick={confirm}
              className="fixed inset-x-4 bottom-20 min-h-[48px] rounded-full bg-gray-900 text-base font-semibold text-white"
            >
              確認送出
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'entry', label: '建立方式' },
    { key: 'processing', label: '辨識中' },
    { key: 'confirm', label: '確認' },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= activeIndex ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-xs ${i <= activeIndex ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
          {i < steps.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: 'draft' | 'confirmed' }) {
  return status === 'draft' ? (
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">草稿・待確認</span>
  ) : (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">已確認</span>
  );
}

function Section({
  title,
  open,
  onToggle,
  fields,
  values,
  mode,
  onChange,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  fields: { key: string; label: string; unit: string }[];
  values: Record<string, string>;
  mode: 'readonly' | 'edit';
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex flex-col divide-y divide-gray-50">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm text-gray-600">{f.label}</span>
              {mode === 'edit' ? (
                <input
                  type="text"
                  inputMode="decimal"
                  value={values[f.key] ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  placeholder="—"
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
      )}
    </div>
  );
}
