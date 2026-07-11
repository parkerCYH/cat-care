import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/** Read by AuthCallback after a successful login to send the user back where they came from. */
export const REDIRECT_AFTER_LOGIN_KEY = 'cat-care:redirect-after-login';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, `${location.pathname}${location.search}`);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
