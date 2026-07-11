import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * The backend has no `/me` endpoint for the cat-care API (confirmed against
 * /Users/eustacecheng/parker-api openapi.json and src/modules/auth/jwt.ts) — the only
 * place the caller's identity shows up client-side is the `playerId` claim on the access
 * token JWT. We decode it here (no signature verification — this is display-only, e.g.
 * "which player-list row is mine" / custodian-badge matching. Every actual authorization
 * decision is still enforced server-side via 401/403/404/409 responses).
 */
export function useCurrentPlayerId(): string | null {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMemo(() => {
    if (!accessToken) return null;
    try {
      const payloadSegment = accessToken.split('.')[1];
      if (!payloadSegment) return null;
      const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64)) as { playerId?: unknown };
      return typeof json.playerId === 'string' ? json.playerId : null;
    } catch {
      return null;
    }
  }, [accessToken]);
}
