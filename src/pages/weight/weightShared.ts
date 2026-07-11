import type { GetApiV1CatCareCatsCatIdWeightRecords200ItemMethod } from '@/api/generated/model/getApiV1CatCareCatsCatIdWeightRecords200ItemMethod';

// "current user id" (owner check for issue #8's hidden edit/delete rule) now lives in the
// shared `useCurrentUserId()` hook at src/lib/currentUser.ts (phase-2 integration pass,
// issue #10) — this file used to have its own decode here that read a `sub`/`userId`/`id`
// claim that never actually appears on this backend's access token (only `playerId` does,
// see src/lib/currentUser.ts's comment), so it always resolved to null. Consolidated.

/** 後端固定存公克(weightGrams),前端顯示層換算成公斤(issue #8 決議)。 */
export function formatKg(weightGrams: number): string {
  return `${(weightGrams / 1000).toFixed(1)}kg`;
}

export function gramsFromKgInput(weightKg: number): number {
  return Math.round(weightKg * 1000);
}

type NonNullMethod = Exclude<GetApiV1CatCareCatsCatIdWeightRecords200ItemMethod, null>;

/** 後端 method enum 中文對照表(issue #8 決議,沿用後端 enum,不自訂)。 */
export const METHOD_LABELS: Record<NonNullMethod, string> = {
  catScale: '貓用體重計',
  holdAndSubtract: '抱著量再扣除自己體重',
  other: '其他',
};

export function methodLabel(method: GetApiV1CatCareCatsCatIdWeightRecords200ItemMethod | null | undefined): string {
  return method ? METHOD_LABELS[method] : '未提供';
}

export const METHOD_OPTIONS: { value: NonNullMethod; label: string }[] = [
  { value: 'catScale', label: '貓用體重計' },
  { value: 'holdAndSubtract', label: '抱著量再扣除自己體重' },
  { value: 'other', label: '其他' },
];

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** For <input type="datetime-local">: ISO string -> "YYYY-MM-DDTHH:mm" in local time. */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** For <input type="datetime-local">: local "YYYY-MM-DDTHH:mm" -> ISO string (UTC) for the API. */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
