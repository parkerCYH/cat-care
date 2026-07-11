import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { REDIRECT_AFTER_LOGIN_KEY } from '@/routes/ProtectedRoute';

/**
 * GET /api/v1/auth/google/callback (backend) 302-redirects the browser here with either
 * ?accessToken=&refreshToken= on success, or ?error=<code> on cancellation/failure
 * (issue #3 resolution). This page only branches on the `error` param — it does not
 * call the backend itself.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [status, setStatus] = useState<'pending' | 'error'>('pending');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setStatus('error');
      return;
    }

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    if (!accessToken || !refreshToken) {
      setStatus('error');
      return;
    }

    login({ accessToken, refreshToken });

    const redirectTo = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    navigate(redirectTo || '/', { replace: true });
  }, [searchParams, login, navigate]);

  if (status === 'error') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-red-600">登入失敗或已取消</p>
        <a href="/login" className="text-sm font-medium text-gray-900 underline">
          重新登入
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 text-center">
      <p className="text-sm text-gray-500">登入中…</p>
    </div>
  );
}
