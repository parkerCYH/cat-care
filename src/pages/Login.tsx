import { API_BASE_URL } from '@/stores/authStore';

// Login is a backend-driven redirect OAuth flow (issue #3): this page just kicks the
// browser to GET /api/v1/auth/google. All token handling happens in AuthCallback.
export function Login() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-semibold text-gray-900">Cat Care</p>
      <a
        href={`${API_BASE_URL}/api/v1/auth/google`}
        className="rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white"
      >
        使用 Google 登入
      </a>
    </div>
  );
}
