import { API_BASE_URL, useAuthStore } from '@/stores/authStore';

export type ChatStreamError = 'not_found' | 'eve_unreachable' | 'network';

/**
 * 票 25:送出訊息呼叫的是串流回應(text/plain chunked),orval 產生的 axios mutation hook
 * 只能拿到「等整段回完」的結果,做不到逐段 append 到畫面——這裡繞開 orval/axios,直接用原生
 * `fetch` 讀 `ReadableStream`。刻意不接受外部 `AbortSignal`:使用者離開對話畫面不該中斷這次
 * 送出——`parker-api` 在呼叫 eve 之前就已經同步把使用者訊息寫進 DB(見 service.ts 的
 * `sendMessage`),讓這個 fetch 繼續在背景跑完,才不會连帶砍斷 assistant 回覆的持久化。
 */
export async function streamChatMessage(
  catId: string,
  conversationId: string,
  content: string,
  onChunk: (chunkText: string) => void,
): Promise<{ ok: true } | { ok: false; error: ChatStreamError }> {
  const { accessToken } = useAuthStore.getState();

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/cat-care/cats/${catId}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ content }),
      },
    );
  } catch {
    return { ok: false, error: 'network' };
  }

  if (!response.ok || !response.body) {
    if (response.status === 404) return { ok: false, error: 'not_found' };
    if (response.status === 502) return { ok: false, error: 'eve_unreachable' };
    return { ok: false, error: 'network' };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  } catch {
    return { ok: false, error: 'network' };
  }

  return { ok: true };
}

export function chatStreamErrorText(error: ChatStreamError): string {
  switch (error) {
    case 'not_found':
      return '找不到這則對話,請回列表重新開始';
    case 'eve_unreachable':
      return 'Eve 暫時無法回應,請稍後再試一次';
    case 'network':
      return '連線中斷,請再試一次';
  }
}
