import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  /** In-memory only — never persisted. Cleared on full page reload by design. */
  accessToken: string | null;
  /** Persisted to localStorage. Treated as never-expiring per issue #3 resolution
   * (backend has no sliding expiration / rotation on refresh). */
  refreshToken: string | null;
  /** Derived from refreshToken presence; recomputed on every state change and on rehydrate. */
  isAuthenticated: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  /**
   * Passive refresh only. Call this from the API layer's 401 handler (see
   * src/api/mutator.ts) — never proactively on a timer. Returns the new accessToken,
   * or null if the refresh itself failed (in which case the caller should treat the
   * user as logged out).
   */
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: ({ accessToken, refreshToken }) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const response = await axios.post<{ accessToken: string }>(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refreshToken },
          );
          const { accessToken } = response.data;
          set({ accessToken, isAuthenticated: true });
          return accessToken;
        } catch {
          // Refresh itself 401'd (or network failure) — refreshToken is invalid/revoked.
          set({ accessToken: null, refreshToken: null, isAuthenticated: false });
          return null;
        }
      },
    }),
    {
      name: 'cat-care-auth',
      storage: createJSONStorage(() => localStorage),
      // accessToken is intentionally excluded here — it must stay memory-only.
      partialize: (state) => ({ refreshToken: state.refreshToken }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = Boolean(state.refreshToken);
        }
      },
    },
  ),
);
