import axios, { type AxiosError } from 'axios';

const apiPrefix = '/api';
const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:5000';
const url = new URL(configured);
const basePath = url.pathname.replace(/\/+$/, '');
url.pathname = basePath.endsWith(apiPrefix) ? basePath : `${basePath}${apiPrefix}`;

export const http = axios.create({ baseURL: url.toString().replace(/\/$/, '') });

export function attachTokenProvider(getToken: () => string | null | undefined) {
  http.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });
}

http.interceptors.response.use(
  (response) => {
    const payload = response.data;
    response.data = payload?.data ?? payload;
    return response;
  },
  (error: AxiosError<{ message?: string }>) =>
    Promise.reject(new Error(error.response?.data?.message ?? (error.response ? `Request failed (${error.response.status})` : error.message))),
);

export const api = {
  get: <T>(path: string) => http.get<T>(path).then((r) => r.data),
  post: <T>(path: string, body?: unknown) => http.post<T>(path, body).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => http.patch<T>(path, body).then((r) => r.data),
  put: <T>(path: string, body?: unknown) => http.put<T>(path, body).then((r) => r.data),
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;