import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  useGetApiV1CatCareCats,
  getGetApiV1CatCareCatsCatIdConversationsQueryOptions,
  getGetApiV1CatCareCatsCatIdConversationsQueryKey,
  usePostApiV1CatCareCatsCatIdConversations,
} from '@/api/generated/cat-care/cat-care';
import { EmptyState } from '@/components/EmptyState';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { formatGroupLabel, formatTime } from '@/lib/date';

interface FlatConversation {
  id: string;
  catId: string;
  catName: string;
  createdAt: string;
}

/**
 * `/chat` — 票 25:落地票 16 定案的變體 C(扁平列表＋建立時選貓＋沉浸式串流)。後端沒有
 * 「跨貓咪列出全部對話串」的端點(`GET .../conversations` 是單一貓咪範圍),這裡用
 * `useQueries` 對每隻貓平行查一次再前端合併,呼應 `CatSwitcher` 已有的「一次抓全部貓咪」模式。
 */
export function ChatList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catsQuery = useGetApiV1CatCareCats();
  const cats = useMemo(() => (catsQuery.data ?? []).filter((cat) => !cat.archivedAt), [catsQuery.data]);

  const conversationQueries = useQueries({
    queries: cats.map((cat) => getGetApiV1CatCareCatsCatIdConversationsQueryOptions(cat.id)),
  });

  const [pickingCat, setPickingCat] = useState(false);
  const createConversation = usePostApiV1CatCareCatsCatIdConversations();

  const isLoading = catsQuery.isLoading || conversationQueries.some((query) => query.isLoading);
  const isError = catsQuery.isError || conversationQueries.some((query) => query.isError);

  // 不用 useMemo:conversationQueries 是動態長度陣列,塞進 deps 會讓陣列長度隨貓咪數量變動,
  // 觸發 React 的 deps-size-changed 警告;這裡資料量小(單一家庭小工具),每次 render 重新排序
  // 一次的成本可忽略,不值得為了記憶化多繞一層。
  const conversations: FlatConversation[] = [];
  cats.forEach((cat, index) => {
    const data = conversationQueries[index]?.data ?? [];
    data.forEach((conversation) => {
      conversations.push({ id: conversation.id, catId: cat.id, catName: cat.name, createdAt: conversation.createdAt });
    });
  });
  conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function startNewConversation(catId: string) {
    createConversation.mutate(
      { catId },
      {
        onSuccess: (conversation) => {
          queryClient.invalidateQueries({ queryKey: getGetApiV1CatCareCatsCatIdConversationsQueryKey(catId) });
          navigate(`/chat/${catId}/${conversation.id}`);
        },
      },
    );
  }

  function handleNewConversationClick() {
    if (cats.length === 0 || createConversation.isPending) return;
    if (cats.length === 1) {
      startNewConversation(cats[0].id);
      return;
    }
    setPickingCat(true);
  }

  if (isLoading) {
    return <div className="px-4 py-6 text-sm text-gray-500">載入中…</div>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8">
        <p className="text-sm font-medium text-red-600">載入失敗</p>
        <RetryButton
          onRetry={() => {
            catsQuery.refetch();
            conversationQueries.forEach((query) => query.refetch());
          }}
        />
      </div>
    );
  }

  if (cats.length === 0) {
    return <div className="px-4 py-6 text-sm text-gray-500">尚未加入任何貓咪</div>;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-24">
      <h1 className="text-base font-semibold text-gray-900">聊天</h1>

      {conversations.length === 0 ? (
        <EmptyState icon="💬" text="還沒有跟 Eve 的對話" />
      ) : (
        <ul className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                to={`/chat/${conversation.catId}/${conversation.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
              >
                <span className="text-sm text-gray-900">
                  {formatGroupLabel(conversation.createdAt)} {formatTime(conversation.createdAt)}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {conversation.catName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleNewConversationClick}
        disabled={createConversation.isPending}
        aria-label="新建對話"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white shadow-lg disabled:opacity-50"
      >
        ＋
      </button>

      {pickingCat && (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            aria-label="關閉"
            className="absolute inset-0 bg-black/40"
            onClick={() => setPickingCat(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl">
            <p className="mb-3 text-sm font-medium text-gray-900">這則對話是關於哪隻貓？</p>
            <ul className="flex flex-col gap-1">
              {cats.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPickingCat(false);
                      startNewConversation(cat.id);
                    }}
                    className="block min-h-[48px] w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-gray-900"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
