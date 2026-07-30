import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePostApiV1CatCareCatsCatIdBloodworkRecordsHealthAdvice } from '@/api/generated/cat-care/cat-care';
import { HealthAdviceCard } from '@/components/HealthAdviceCard';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { useCurrentCat } from '@/hooks/useCurrentCat';

interface HealthAdviceNavigationState {
  bloodworkRecordIds?: string[];
}

/**
 * `/bloodwork/health-advice` — 票 23：觸發票 22 的同步 endpoint 並顯示結構化建議。
 * 選取哪些驗血紀錄由呼叫端（`BloodworkTable` 多選、`BloodworkDetail` 單筆）透過
 * `navigate(..., { state })` 帶進來,不用路由參數或另存暫存狀態——這是一次性的觸發動作,
 * 沒有需要保留給重新整理後還原的理由(比照本頁沒有 URL 就無法重觸發的設計)。
 *
 * 自動觸發的 mutate() 用 setTimeout 延到下一個 macrotask 才真正呼叫(而不是直接在 effect
 * 裡呼叫):React 18 StrictMode 在 dev 模式會同步跑「掛載 → 卸載 → 再掛載」來檢測副作用,
 * `useMutation` 內部的 `useSyncExternalStore` 訂閱也會被這個機制卸載又重新訂閱——如果
 * mutate() 在第一次掛載就同步呼叫,對應的 observer 會在該次同步流程的卸載階段跟這個
 * mutation 解除訂閱,導致真正的 API 回應完成時,畫面讀到的是已經跟這次 mutation 分離的
 * observer,永遠停在 pending(實測發現:後端已經成功回傳,`onSuccess`/`onSettled` 都有觸發,
 * 但畫面读到的 `mutation.isPending` 卻不會變成 false)。用 setTimeout 把真正呼叫 mutate()
 * 延到這個同步的雙重觸發流程結束後才執行,可以避開這個競態。
 */
export function BloodworkHealthAdvice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const bloodworkRecordIds = (location.state as HealthAdviceNavigationState | null)?.bloodworkRecordIds ?? [];
  const triggeredRef = useRef(false);

  const mutation = usePostApiV1CatCareCatsCatIdBloodworkRecordsHealthAdvice();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (triggeredRef.current || !catId || bloodworkRecordIds.length === 0) return;
      triggeredRef.current = true;
      mutation.mutate({ catId, data: { bloodworkRecordIds } });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  function retry() {
    if (!catId) return;
    mutation.mutate({ catId, data: { bloodworkRecordIds } });
  }

  if (bloodworkRecordIds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-gray-500">沒有選取任何驗血紀錄</p>
        <Link to="/bloodwork/table" className="text-sm font-medium text-gray-900 underline">
          回驗血歷史選取
        </Link>
      </div>
    );
  }

  if (isCatLoading || !catId || mutation.isPending || mutation.isIdle) {
    return (
      <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-[#FAECE7] px-6 py-10 text-center">
        <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#F0997B] text-3xl">
          🩺
        </div>
        <p className="text-sm font-medium text-[#D85A30]">AI 正在分析驗血數據,請稍候…</p>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-red-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-red-600">取得建議失敗,請重試</p>
        <RetryButton onRetry={retry} isPending={mutation.isPending} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">AI 健康建議</h1>
        <button type="button" onClick={() => navigate(-1)} className="text-sm font-medium text-gray-500">
          關閉
        </button>
      </div>
      <HealthAdviceCard advice={mutation.data.advice} createdAt={mutation.data.createdAt} />
    </div>
  );
}
