import { backendRequest } from "@/lib/backendApi";
import { getBackendAccessToken } from "@/lib/backendSession";

type CompatOperator = "eq" | "gt" | "gte" | "lt" | "lte" | "in" | "ilike" | "not";

export interface CompatFilter {
  column: string;
  operator: CompatOperator;
  value: unknown;
  notOperator?: string;
}

export interface CompatOrder {
  column: string;
  ascending?: boolean;
}

interface CompatMutationOptions {
  single?: boolean;
  maybeSingle?: boolean;
  onConflict?: string;
}

interface CompatSelectOptions {
  filters?: CompatFilter[];
  order?: CompatOrder[];
  limit?: number;
  offset?: number;
  range?: [number, number];
  single?: boolean;
  maybeSingle?: boolean;
  count?: "exact";
  head?: boolean;
  or?: string;
}

interface CompatResponse<T> {
  data: T;
  count?: number | null;
}

const BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL?.trim() || "/api/v1";

const buildUrl = (path: string) => {
  const normalizedBase = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(`${normalizedBase}${normalizedPath}`, window.location.origin).toString();
};

const normalizeDepthLevel = (value: unknown) => {
  if (typeof value === "number") {
    if (value <= 1) return "beginner";
    if (value === 2) return "intermediate";
    return "advanced";
  }

  return value;
};

const normalizeRow = (table: string, row: Record<string, unknown> | null) => {
  if (!row) {
    return row;
  }

  if (table === "contents" || table === "trainer_courses") {
    return {
      ...row,
      depth_level: normalizeDepthLevel(row.depth_level),
      url: row.url ?? row.media_url ?? null,
    };
  }

  if (table === "rooms") {
    return {
      ...row,
      access_type: row.access_type ?? "public",
    };
  }

  return row;
};

const normalizeResult = <T>(table: string, data: T): T => {
  if (Array.isArray(data)) {
    return data.map((row) =>
      row && typeof row === "object" ? normalizeRow(table, row as Record<string, unknown>) : row,
    ) as T;
  }

  if (data && typeof data === "object") {
    return normalizeRow(table, data as Record<string, unknown>) as T;
  }

  return data;
};

const runCompatQuery = async <T>(
  table: string,
  operation: "select" | "insert" | "update" | "delete" | "upsert",
  payload: Record<string, unknown>,
  requireAuth = operation !== "select",
): Promise<CompatResponse<T>> => {
  const response = await backendRequest<CompatResponse<T>>("/compat/query", {
    method: "POST",
    body: {
      table,
      operation,
      ...payload,
    },
    requireAuth,
  });

  return {
    ...response,
    data: normalizeResult(table, response.data) as T,
  };
};

export const compatSelect = async <T>(
  table: string,
  options: CompatSelectOptions = {},
): Promise<CompatResponse<T>> =>
  runCompatQuery<T>(table, "select", {
    filters: options.filters || [],
    order: options.order || [],
    limit: options.limit ?? null,
    offset: options.offset ?? null,
    range: options.range ?? null,
    single: Boolean(options.single),
    maybeSingle: Boolean(options.maybeSingle),
    count: options.count ?? null,
    head: Boolean(options.head),
    or: options.or ?? null,
  }, false);

export const compatInsert = async <T>(
  table: string,
  payload: unknown,
  options: CompatMutationOptions = {},
): Promise<CompatResponse<T>> =>
  runCompatQuery<T>(table, "insert", {
    payload,
    single: Boolean(options.single),
    maybeSingle: Boolean(options.maybeSingle),
    onConflict: options.onConflict ?? null,
  });

export const compatUpsert = async <T>(
  table: string,
  payload: unknown,
  options: CompatMutationOptions = {},
): Promise<CompatResponse<T>> =>
  runCompatQuery<T>(table, "upsert", {
    payload,
    single: Boolean(options.single),
    maybeSingle: Boolean(options.maybeSingle),
    onConflict: options.onConflict ?? null,
  });

export const compatUpdate = async <T>(
  table: string,
  payload: unknown,
  filters: CompatFilter[],
  options: CompatMutationOptions = {},
): Promise<CompatResponse<T>> =>
  runCompatQuery<T>(table, "update", {
    payload,
    filters,
    single: Boolean(options.single),
    maybeSingle: Boolean(options.maybeSingle),
  });

export const compatDelete = async <T>(
  table: string,
  filters: CompatFilter[],
  options: CompatMutationOptions = {},
): Promise<CompatResponse<T>> =>
  runCompatQuery<T>(table, "delete", {
    filters,
    single: Boolean(options.single),
    maybeSingle: Boolean(options.maybeSingle),
  });

export const uploadCompatFile = async (file: File) => {
  const token = getBackendAccessToken();

  if (!token) {
    throw new Error("Backend session is required.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl("/media/upload"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({} as { error?: { message?: string }; url?: string; data?: { url?: string } }));
  if (!response.ok || payload.success === false) {
    throw new Error(payload?.error?.message || payload?.message || "Upload failed.");
  }

  return payload.url || payload.data?.url || null;
};
