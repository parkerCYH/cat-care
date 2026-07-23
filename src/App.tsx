import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { router } from '@/routes/router';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt';
import { useAppReady } from '@/hooks/useAppReady';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLoadingGate />
      <PwaUpdatePrompt />
    </QueryClientProvider>
  );
}

/**
 * 票 04 定案的閘門層級:`App.tsx` 最外層,涵蓋 auth rehydrate + 首次貓咪清單 fetch;之後頁面間
 * 切換不重複顯示這個全螢幕載入畫面,各頁沿用既有的區域性 loading 文字。獨立成子元件(而非直接
 * 寫在 `App` 裡)是因為 `useAppReady` 要呼叫 `useGetApiV1CatCareCats`,需要在
 * `QueryClientProvider` 底下才有 context 可用。
 */
function AppLoadingGate() {
  const { ready, progress, stageText } = useAppReady();

  if (!ready) {
    return <AppLoadingScreen progress={progress} stageText={stageText} />;
  }

  return <RouterProvider router={router} />;
}
