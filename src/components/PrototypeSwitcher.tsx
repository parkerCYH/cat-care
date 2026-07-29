import { useEffect } from 'react';

export interface PrototypeVariant {
  key: string;
  name: string;
}

/**
 * PROTOTYPE-ONLY — 通用的浮動變體切換列，供 `/prototype/*` throwaway route 使用。
 * 只在 dev 環境掛載（呼叫端已用 `import.meta.env.DEV` 擋掉正式環境的路由本身），
 * 這裡再擋一次純粹是保險，避免元件被誤用在非 dev 情境。
 */
export function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: {
  variants: PrototypeVariant[];
  current: string;
  onChange: (key: string) => void;
}) {
  const index = variants.findIndex((v) => v.key === current);
  const active = variants[index] ?? variants[0];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      if (e.key === 'ArrowLeft') onChange(variants[(index - 1 + variants.length) % variants.length].key);
      if (e.key === 'ArrowRight') onChange(variants[(index + 1) % variants.length].key);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, variants, onChange]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-gray-700 bg-gray-900/95 px-2 py-2 text-white shadow-lg">
        <button
          type="button"
          aria-label="上一個變體"
          onClick={() => onChange(variants[(index - 1 + variants.length) % variants.length].key)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
        >
          ←
        </button>
        <span className="min-w-[9rem] text-center text-sm font-medium">
          {active.key} — {active.name}
        </span>
        <button
          type="button"
          aria-label="下一個變體"
          onClick={() => onChange(variants[(index + 1) % variants.length].key)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
        >
          →
        </button>
      </div>
    </div>
  );
}
