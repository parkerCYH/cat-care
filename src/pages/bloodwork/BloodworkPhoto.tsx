import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetApiV1CatCareCatsCatIdBloodworkRecords,
  usePostApiV1CatCareCatsCatIdBloodworkRecordsRecognize,
} from '@/api/generated/cat-care/cat-care';
import { useCurrentCat } from '@/hooks/useCurrentCat';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;
// 用來抵銷 client/server 時鐘誤差,判斷「這筆 draft 是不是這次辨識產生的」時往前留一點餘裕,
// 避免 job 送出瞬間就有的舊 draft(理論上不該存在,但保守起見不假設列表一定是空的)被誤判。
const CLOCK_SKEW_BUFFER_MS = 5000;

type Phase = 'entry' | 'processing' | 'failed';

/**
 * `/bloodwork/photo` — 票 21:把票 12 選定的 UI 變體 A「拍照辨識」分支落地到正式路由,串接
 * 票 20 的 `POST .../recognize` endpoint。沒有任何 push/webhook 機制通知前端辨識完成,只能
 * 在這頁還開著的時候輪詢驗血紀錄列表(票 21 描述裡明確列為可行選項之一),抓到辨識產生的
 * `draft` 紀錄就導去 `/bloodwork/:id`(票 21 擴充過的確認流程)。輪詢逾時或 recognize 本身
 * 就失敗(502 eve 未接受)都當作辨識失敗,導向票 19 的手動填寫入口。
 */
export function BloodworkPhoto() {
  const navigate = useNavigate();
  const { catId, isLoading: isCatLoading } = useCurrentCat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('entry');
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const recognizeMutation = usePostApiV1CatCareCatsCatIdBloodworkRecordsRecognize({
    mutation: {
      onSuccess: () => setStartedAt(Date.now()),
      onError: () => setPhase('failed'),
    },
  });

  const pollQuery = useGetApiV1CatCareCatsCatIdBloodworkRecords(catId ?? '', undefined, {
    query: {
      enabled: !!catId && phase === 'processing',
      refetchInterval: phase === 'processing' ? POLL_INTERVAL_MS : false,
    },
  });

  useEffect(() => {
    if (phase !== 'processing' || !startedAt) return;

    const draft = pollQuery.data?.find(
      (record) =>
        record.status === 'draft' && new Date(record.createdAt).getTime() >= startedAt - CLOCK_SKEW_BUFFER_MS,
    );
    if (draft) {
      navigate(`/bloodwork/${draft.id}`, { replace: true });
      return;
    }

    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      setPhase('failed');
    }
  }, [phase, startedAt, pollQuery.data, navigate]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !catId) return;

    setPhase('processing');
    recognizeMutation.mutate({ catId, data: { photo: file } });
  }

  if (isCatLoading || !catId) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6">
      <h1 className="text-lg font-semibold text-gray-900">拍照辨識驗血報告</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {phase === 'entry' && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-5 py-8 text-gray-700"
        >
          <span className="text-3xl">📷</span>
          <span className="text-base font-semibold">選擇或拍攝驗血報告照片</span>
        </button>
      )}

      {phase === 'processing' && (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-[#FAECE7] px-6 py-10 text-center">
          <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#F0997B] text-3xl">
            🩸
          </div>
          <p className="text-sm font-medium text-[#D85A30]">AI 辨識中,請稍候…</p>
          <p className="text-xs text-[#D85A30]">可以先離開這頁,稍後回到驗血紀錄查看結果</p>
        </div>
      )}

      {phase === 'failed' && (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-600">辨識失敗,請改用手動填寫</p>
          <button
            type="button"
            onClick={() => navigate('/bloodwork/new')}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            前往手動填寫
          </button>
        </div>
      )}
    </div>
  );
}
