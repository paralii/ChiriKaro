import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retryAfterRefresh?: boolean;
  }
}

export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`,
  withCredentials: true,
});

let refreshInFlight: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = http.post('/auth/refresh-token').then(() => undefined).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const requestUrl = config?.url ?? '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh-token');
    if (error.response?.status === 401 && config && !config._retryAfterRefresh && !isAuthRequest) {
      config._retryAfterRefresh = true;
      try {
        await refreshSession();
        return http.request(config);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const api = {
  get: <T>(path: string) => http.get<T>(path).then((r) => r.data),
  post: <T>(path: string, body?: unknown) =>
    http.post<T>(path, body).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) =>
    http.patch<T>(path, body).then((r) => r.data),
  delete: <T>(path: string) => http.delete<T>(path).then((r) => r.data),
  put: <T>(path: string, body?: unknown) =>
    http.put<T>(path, body).then((r) => r.data),
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? (error.response?.data?.message ?? error.message ?? fallback)
    : error instanceof Error
      ? error.message
      : fallback;
