/**
 * The backend has no `GET /auth/me` (or similar) endpoint — the only way the frontend
 * knows "who am I" is by reading the `sub` claim out of the JWT accessToken it already
 * holds in `useAuthStore`. This is a read-only decode (no signature verification needed
 * client-side, the backend verifies on every request) used solely to compare against a
 * record's `recordedBy` for the issue #7 "hide edit/delete for non-owner" rule.
 *
 * This was not specified by any wayfinder ticket — a judgment call made while building
 * issue #7, since owner-only UI is impossible without it. Flagged in the phase-1 report.
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

    const candidate = payload.sub ?? payload.userId ?? payload.id;
    return typeof candidate === 'string' ? candidate : null;
  } catch {
    return null;
  }
}
