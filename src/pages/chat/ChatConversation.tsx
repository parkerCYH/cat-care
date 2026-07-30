import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetApiV1CatCareCatsCatIdConversationsIdMessages } from '@/api/generated/cat-care/cat-care';
import { RetryButton } from '@/components/RetryState/RetryButton';
import { chatStreamErrorText, streamChatMessage, type ChatStreamError } from '@/lib/chatStream';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * `/chat/:catId/:id` — 票 25:落地票 16 定案的單一對話畫面,全螢幕沉浸式覆蓋(`fixed inset-0`
 * 蓋掉 `AppLayout` 的 header),訊息不用聊天泡泡,改用文件式呈現(使用者提問粗體、Eve 回覆在
 * 分隔線下用等寬字逐段流出)。歷史訊息復原走票 25 自己補的 `GET .../messages`(票 24 當時沒做)。
 */
export function ChatConversation() {
  const { catId = '', id = '' } = useParams<{ catId: string; id: string }>();
  const navigate = useNavigate();

  const historyQuery = useGetApiV1CatCareCatsCatIdConversationsIdMessages(catId, id, {
    query: { enabled: !!catId && !!id },
  });

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<ChatStreamError | null>(null);
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (historyQuery.data && !hydrated) {
      setMessages(
        historyQuery.data.map((message) => ({ id: message.id, role: message.role, content: message.content })),
      );
      setHydrated(true);
    }
  }, [historyQuery.data, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  // 刻意不傳 AbortSignal、也不在 unmount 時中斷這個 fetch:parker-api 在呼叫 eve 之前就已經
  // 同步把使用者訊息寫進 DB,離開畫面不該連帶砍斷這次送出或 assistant 回覆的持久化(票 25 AC)。
  async function sendContent(content: string) {
    setError(null);
    setLastFailedContent(null);
    setIsSending(true);

    const userMessageId = `local-user-${Date.now()}`;
    const assistantMessageId = `local-assistant-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: userMessageId, role: 'user', content },
      { id: assistantMessageId, role: 'assistant', content: '' },
    ]);

    const result = await streamChatMessage(catId, id, content, (chunk) => {
      if (!mountedRef.current) return;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId ? { ...message, content: message.content + chunk } : message,
        ),
      );
    });

    if (!mountedRef.current) return;
    setIsSending(false);
    if (!result.ok) {
      setError(result.error);
      setLastFailedContent(content);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;
    setDraft('');
    void sendContent(content);
  }

  function handleRetry() {
    if (lastFailedContent) void sendContent(lastFailedContent);
  }

  if (historyQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-white text-sm text-gray-500">
        載入中…
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-sm font-medium text-red-600">找不到這則對話</p>
        <button
          type="button"
          onClick={() => navigate('/chat', { replace: true })}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          回對話列表
        </button>
      </div>
    );
  }

  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-100 px-2">
        <button
          type="button"
          aria-label="關閉對話"
          onClick={() => navigate('/chat')}
          className="flex h-12 w-12 items-center justify-center text-2xl text-gray-700"
        >
          ×
        </button>
        <span className="text-sm font-semibold text-gray-900">跟 Eve 聊聊</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {messages.map((message) =>
            message.role === 'user' ? (
              <p key={message.id} className="text-base font-bold text-gray-900">
                {message.content}
              </p>
            ) : (
              <div key={message.id} className="border-t border-gray-100 pt-3">
                <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800">
                  {message.content}
                  {isSending && message.id === lastMessageId && (
                    <span aria-hidden="true" className="ml-0.5 inline-block animate-pulse">
                      ▍
                    </span>
                  )}
                </p>
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-auto mt-4 flex max-w-2xl items-center gap-3">
            <p className="text-sm font-medium text-red-600">{chatStreamErrorText(error)}</p>
            {error !== 'not_found' && <RetryButton onRetry={handleRetry} />}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t border-gray-100 px-4 py-3">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="輸入訊息…"
          disabled={isSending}
          className="min-h-[44px] flex-1 rounded-full border border-gray-300 px-4 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isSending || draft.trim().length === 0}
          className="min-h-[44px] shrink-0 rounded-full bg-gray-900 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          送出
        </button>
      </form>
    </div>
  );
}
