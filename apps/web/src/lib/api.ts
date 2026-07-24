// Central fetch wrapper: attaches the access token, and on a 401 transparently
// tries to refresh once (using the httpOnly refresh cookie) before retrying —
// so components never have to think about token expiry.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
    const token = json.data?.accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch {
    return null;
  }
};

interface RequestOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { skipAuthRetry, ...init } = options;

  const doFetch = async (): Promise<Response> =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && !skipAuthRetry && path !== '/auth/refresh') {
    // De-duplicate concurrent refresh attempts across parallel requests
    refreshPromise = refreshPromise ?? refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      res = await doFetch();
    }
  }

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.message || 'Something went wrong',
      json.code || 'UNKNOWN_ERROR',
      res.status,
      json.details
    );
  }

  return json.data as T;
};

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
