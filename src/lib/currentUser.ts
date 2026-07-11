import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * The backend has no `GET /auth/me` (or similar) endpoint — the only way the frontend
 * knows "who am I" is by reading a claim out of the JWT accessToken it already holds in
 * `useAuthStore`. This is a read-only decode (no signature verification needed
 * client-side, the backend verifies on every request) used to compare against a record's
 * `recordedBy`/`measuredBy` for the issue #7/#8 "hide edit/delete for non-owner" rule, and
 * against cat-player rows for issue #9's "(你)" / custodian-badge matching.
 *
 * The access token's payload shape is `{ playerId: string, exp: number }` — confirmed
 * against `/Users/eustacecheng/parker-api/src/modules/auth/jwt.ts`
 * (`signAccessToken(playerId)` → `Jwt.sign({ playerId, exp }, ...)`). There is no `sub`,
 * `userId`, or `id` claim; `playerId` is the only identity claim on this token.
 *
 * This was not specified by any wayfinder ticket — a judgment call made while building
 * issue #7, since owner-only UI is impossible without it. Consolidated in the phase-2
 * integration pass (issue #10) from three near-identical copies: this file (1B), the
 * `sub ?? userId ?? id` variant in `weightShared.ts` (1C, which never matched the real
 * `playerId` claim and always resolved to null — a real bug now fixed here), and
 * `src/pages/cats/useCurrentPlayerId.ts` (1D, the only one that read `playerId` correctly).
 */
export function getCurrentUserId(accessToken: string | null): string | null {
  if (!accessToken) return null;

  try {
    const payloadSegment = accessToken.split('.')[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const payload = JSON.parse(json) as Record<string, unknown>;

    const candidate = payload.playerId ?? payload.sub ?? payload.userId ?? payload.id;
    return typeof candidate === 'string' ? candidate : null;
  } catch {
    return null;
  }
}

/** Hook form of {@link getCurrentUserId}, reading the access token from `useAuthStore`. */
export function useCurrentUserId(): string | null {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMemo(() => getCurrentUserId(accessToken), [accessToken]);
}
