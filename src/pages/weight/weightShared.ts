import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGetApiV1CatCareCats } from '@/api/generated/cat-care/cat-care';
import type { GetApiV1CatCareCatsCatIdWeightRecords200ItemMethod } from '@/api/generated/model/getApiV1CatCareCatsCatIdWeightRecords200ItemMethod';

/**
 * There is no shared "current cat" seam yet — CatSwitcher (src/components/layout/CatSwitcher.tsx)
 * is still a phase-0 stub with a single placeholder entry and no onChange wiring. Until a later
 * pass introduces a real current-cat context, every feature page mirrors the switcher's own
 * assumption: fetch the caller's cats and use the first non-archived one. This is a judgment
 * call documented in the issue #8 implementation report, not a foundation change.
 */
export function useCurrentCatId(): { catId: string | undefined; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useGetApiV1CatCareCats();
  const catId = useMemo(() => data?.find((cat) => !cat.archivedAt)?.id, [data]);
  return { catId, isLoading, isError };
}

/**
 * The generated API client has no `/me` or profile endpoint, and useAuthStore only exposes
 * the raw tokens (see src/stores/authStore.ts) — no decoded user id. `measuredBy` on a weight
 * record is the measuring Player's id (uuid, per the generated zod response schema), so to
 * decide whether to show edit/delete affordances (issue #8 resolution: hidden entirely for
 * non-owner records, mirroring issue #7) we decode the `sub` claim out of the JWT access token
 * ourselves rather than touching the shared auth store. This is a best-effort UI-only check —
 * the backend is the real enforcement (403 on non-owner edit/delete).
 */
export function useCurrentUserId(): string | undefined {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMemo(() => decodeJwtSubject(accessToken), [accessToken]);
}

function decodeJwtSubject(token: string | null): string | undefined {
  if (!token) return undefined;
  const payload = token.split('.')[1];
  if (!payload) return undefined;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const claims = JSON.parse(json) as Record<string, unknown>;
    const candidate = claims.sub ?? claims.userId ?? claims.playerId ?? claims.id;
    return typeof candidate === 'string' ? candidate : undefined;
  } catch {
    return undefined;
  }
}

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
