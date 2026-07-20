import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';

export interface AppReadyState {
  ready: boolean;
  progress: number;
  stageText: string;
}

/**
 * 票 04 定案的兩階段序列(2026-07-20 prototype 定案):0–50% 等 auth persist rehydrate 完成
 * (驗證登入中),50–100% 等首次貓咪清單 fetch settle(載入貓咪資料中)。比例用階段數平均分配,
 * 不加權——沒有精確耗時數據,加權是假精確度。
 *
 * 未登入(rehydrate 完後 isAuthenticated 仍是 false)直接視為 ready:`ProtectedRoute` 會導去
 * `/login`,不會真的發出貓咪清單請求,沒有第二階段要等。
 *
 * 用 `isSuccess || isError`(settled)而非 `isLoading` 判斷第二階段是否完成——v5 的 `isLoading`
 * 只在 `enabled` 已經是 true 且正在 fetching 時為真,rehydrate 完成到查詢真的開始 fetch 之間有
 * 一個 render tick 是 `enabled` 剛翻 true 但 `isLoading` 還是 false,用 settled 判斷才不會在那個
 * tick 誤判成「已完成」而讓載入畫面提早消失又閃現貓咪清單的區域性 loading 狀態。
 */
export function useAppReady(): AppReadyState {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const catsQuery = useGetApiV1CatCareCats({
    query: { enabled: hydrated && isAuthenticated },
  });

  if (!hydrated) {
    return { ready: false, progress: 0, stageText: '驗證登入中…' };
  }

  if (!isAuthenticated) {
    return { ready: true, progress: 100, stageText: '' };
  }

  const catsSettled = catsQuery.isSuccess || catsQuery.isError;
  if (!catsSettled) {
    return { ready: false, progress: 50, stageText: '載入貓咪資料中…' };
  }

  return { ready: true, progress: 100, stageText: '' };
}
