import { useSearchParams } from 'react-router-dom';
import { PrototypeSwitcher } from '@/components/PrototypeSwitcher';
import { VariantA } from './bloodwork/VariantA';
import { VariantB } from './bloodwork/VariantB';
import { VariantC } from './bloodwork/VariantC';

// PROTOTYPE — 票 12（cat-care-bloodwork-ai-record）的 UI 稿。三個變體示範同一個問題的三種
// 完全不同解法：入口放哪裡、上傳後等待辨識的畫面狀態、draft/confirmed 兩態表單怎麼呈現、
// 34 個欄位怎麼分組排版。用 ?variant= 切換，不接真實 API，全部本地假資料 + 假的等待模擬。
// 只在 `apps/cat-care` 開發模式下掛載這條路由（見 `router.tsx`），正式環境不會出現。
const VARIANTS = [
  { key: 'A', name: '單頁精靈' },
  { key: 'B', name: 'FAB + 背景處理' },
  { key: 'C', name: '密集表格' },
];

export function BloodworkFlowPrototype() {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant = searchParams.get('variant') ?? 'A';

  function setVariant(key: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('variant', key);
      return next;
    });
  }

  return (
    <>
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={setVariant} />
    </>
  );
}
