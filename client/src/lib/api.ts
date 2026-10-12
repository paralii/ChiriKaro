const apiPrefix = '/api/v1';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000';
const apiUrl = new URL(configuredApiUrl);
const normalizedPath = apiUrl.pathname.replace(/\/+$/, '');
apiUrl.pathname = normalizedPath.endsWith(apiPrefix) ? normalizedPath : `${normalizedPath}${apiPrefix}`;
const apiBaseUrl = apiUrl.toString().replace(/\/$/, '');

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const normalizedRoute = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${apiBaseUrl}${normalizedRoute}`, { ...options, headers });
  const payload = await response.json().catch(() => ({})) as { message?: string; data?: T };
  if (!response.ok) throw new Error(payload.message ?? `Request failed (${response.status})`);
  return (payload.data ?? payload) as T;
}