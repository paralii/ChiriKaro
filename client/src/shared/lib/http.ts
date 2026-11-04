import axios, { type AxiosError } from 'axios';
import { store } from "@store/store";
export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
});


http.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;

  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
(response) => response,
(error: AxiosError<{ message?: string }>) => Promise.reject(error),
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
  post: <T>(path: string, body?: unknown) => http.post<T>(path, body).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => http.patch<T>(path, body).then((r) => r.data),
  put: <T>(path: string, body?: unknown) => http.put<T>(path, body).then((r) => r.data),
};

export const getErrorMessage = (error: unknown, fallback: string) =>
axios.isAxiosError<{ message?: string }>(error)
? error.response?.data?.message ?? error.message ?? fallback
: error instanceof Error
? error.message
: fallback;