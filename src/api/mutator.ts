import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, useAuthStore } from '@/stores/authStore';

export const AXIOS_INSTANCE = axios.create({ baseURL: API_BASE_URL });

AXIOS_INSTANCE.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Passive 401 refresh (issue #3): don't watch expiry, just react to a 401, refresh once,
// and retry the original request. If refresh itself fails, log the user out — no redirect
// loop, no proactive polling. Multiple concurrent 401s share a single in-flight refresh.
let refreshPromise: Promise<string | null> | null = null;

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = useAuthStore
          .getState()
          .refreshAccessToken()
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return AXIOS_INSTANCE(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

/** orval `client: 'react-query'` mutator — see orval.config.ts */
export const customInstance = <T,>(config: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({ ...config, cancelToken: source.token }).then(
    (response: AxiosResponse<T>) => response.data,
  );

  // @ts-expect-error orval's cancellation contract expects a `.cancel()` on the promise
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default customInstance;

export type ErrorType<Error> = AxiosError<Error>;
