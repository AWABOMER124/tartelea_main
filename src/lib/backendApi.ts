import { getBackendAccessToken } from "@/lib/backendSession";

const DEFAULT_BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL?.trim() || "/api/v1";

type Primitive = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, Primitive>;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  attachAuthToken?: boolean;
}

const buildUrl = (path: string, query?: Record<string, Primitive>) => {
  const normalizedBase = DEFAULT_BACKEND_API_BASE_URL.endsWith("/")
    ? DEFAULT_BACKEND_API_BASE_URL.slice(0, -1)
    : DEFAULT_BACKEND_API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`, window.location.origin);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

export async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getBackendAccessToken();
  const shouldAttachAuthToken = options.attachAuthToken !== false;

  if (options.requireAuth && !token) {
    throw new Error("Backend session is required for this action.");
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token && shouldAttachAuthToken ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    error?: { message?: string };
  } & T;

  if (!response.ok || payload.success === false) {
    throw new Error(
      payload.error?.message || payload.message || "Backend request failed.",
    );
  }

  return payload as T;
}
