import {
  BACKEND_SESSION_EVENT,
  clearBackendSession,
  getBackendAccessToken,
  getStoredBackendSession,
} from "@/lib/backendSession";

const BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL?.trim() || "/api/v1";

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";

type CompatUser = {
  id: string;
  email: string;
  role?: string;
  roles?: string[];
  full_name?: string | null;
  avatar_url?: string | null;
};

type CompatSession = {
  access_token: string;
  refresh_token: string | null;
  user: CompatUser;
};

type CompatResponse<T> = Promise<{
  data: T;
  error: { message: string; code?: string } | null;
  count?: number | null;
}>;

type QueryFilter = {
  column: string;
  operator: "eq" | "gt" | "gte" | "lt" | "lte" | "in" | "ilike" | "not";
  value: unknown;
  notOperator?: string;
};

type QueryOrder = {
  column: string;
  ascending?: boolean;
};

const uploadUrlCache = new Map<string, string>();

const buildUrl = (path: string) => {
  const normalizedBase = BACKEND_API_BASE_URL.endsWith("/")
    ? BACKEND_API_BASE_URL.slice(0, -1)
    : BACKEND_API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(`${normalizedBase}${normalizedPath}`, window.location.origin).toString();
};

const toCompatUser = (): CompatUser | null => {
  const session = getStoredBackendSession();
  const user = session.user;

  if (!user?.id || !session.accessToken) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    roles: user.roles,
    full_name: user.fullName ?? null,
    avatar_url: user.avatarUrl ?? null,
  };
};

const toCompatSession = (): CompatSession | null => {
  const session = getStoredBackendSession();
  const user = toCompatUser();

  if (!session.accessToken || !user) {
    return null;
  }

  return {
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    user,
  };
};

const buildError = (message: string, code?: string) => ({
  message,
  code,
});

const postJson = async <T>(path: string, body: unknown, requireAuth = false): CompatResponse<T> => {
  try {
    const token = getBackendAccessToken();

    if (requireAuth && !token) {
      return {
        data: null as T,
        error: buildError("Backend session is required."),
        count: null,
      };
    }

    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
      return {
        data: null as T,
        error: buildError(
          payload?.error?.message || payload?.message || "Backend request failed.",
          payload?.error?.code,
        ),
        count: payload?.count ?? null,
      };
    }

    return {
      data: (payload.data ?? null) as T,
      error: null,
      count: payload.count ?? null,
    };
  } catch (error) {
    return {
      data: null as T,
      error: buildError(error instanceof Error ? error.message : "Backend request failed."),
      count: null,
    };
  }
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

class CompatQueryBuilder<T = unknown> implements PromiseLike<{ data: T; error: { message: string; code?: string } | null; count?: number | null }> {
  private table: string;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: unknown = null;
  private filters: QueryFilter[] = [];
  private orders: QueryOrder[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private rangeValue: [number, number] | null = null;
  private expectSingle = false;
  private expectMaybeSingle = false;
  private countValue: "exact" | null = null;
  private headValue = false;
  private orValue: string | null = null;
  private onConflictValue: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.operation = "select";
    this.countValue = options?.count || null;
    this.headValue = Boolean(options?.head);
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  upsert(payload: unknown, options?: { onConflict?: string }) {
    this.operation = "upsert";
    this.payload = payload;
    this.onConflictValue = options?.onConflict || null;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: "eq", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ column, operator: "gt", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, operator: "gte", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: "lt", value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, operator: "lte", value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, operator: "in", value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, operator: "ilike", value });
    return this;
  }

  not(column: string, notOperator: string, value: unknown) {
    this.filters.push({ column, operator: "not", value, notOperator });
    return this;
  }

  or(expression: string) {
    this.orValue = expression;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending });
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  range(from: number, to: number) {
    this.rangeValue = [from, to];
    return this;
  }

  single() {
    this.expectSingle = true;
    this.expectMaybeSingle = false;
    return this;
  }

  maybeSingle() {
    this.expectMaybeSingle = true;
    this.expectSingle = false;
    return this;
  }

  async execute() {
    const response = await postJson<unknown>("/compat/query", {
      table: this.table,
      operation: this.operation,
      payload: this.payload,
      filters: this.filters,
      order: this.orders,
      limit: this.limitValue,
      offset: this.offsetValue,
      range: this.rangeValue,
      single: this.expectSingle,
      maybeSingle: this.expectMaybeSingle,
      count: this.countValue,
      head: this.headValue,
      or: this.orValue,
      onConflict: this.onConflictValue,
    }, this.operation !== "select");

    return {
      ...response,
      data: normalizeResult(this.table, response.data) as T,
    };
  }

  then<TResult1 = { data: T; error: { message: string; code?: string } | null; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T; error: { message: string; code?: string } | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const auth = {
  async getSession() {
    return {
      data: {
        session: toCompatSession(),
      },
      error: null,
    };
  },
  async getUser() {
    return {
      data: {
        user: toCompatUser(),
      },
      error: null,
    };
  },
  onAuthStateChange(callback: (event: AuthEvent, session: CompatSession | null) => void) {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ event: AuthEvent; session?: unknown }>;
      callback(customEvent.detail?.event || "USER_UPDATED", toCompatSession());
    };

    window.addEventListener(BACKEND_SESSION_EVENT, handler as EventListener);

    return {
      data: {
        subscription: {
          unsubscribe() {
            window.removeEventListener(BACKEND_SESSION_EVENT, handler as EventListener);
          },
        },
      },
    };
  },
  async signOut() {
    clearBackendSession();
    return { error: null };
  },
  async updateUser() {
    return {
      data: null,
      error: buildError("Direct auth updates are not supported in backend-first mode."),
    };
  },
  async setSession() {
    return {
      data: null,
      error: buildError("OAuth compatibility sessions are disabled in backend-first mode."),
    };
  },
};

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File, _options?: { upsert?: boolean }) {
        const token = getBackendAccessToken();

        if (!token) {
          return { data: null, error: buildError("Backend session is required.") };
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("bucket", bucket);
          formData.append("path", path);

          const response = await fetch(buildUrl("/media/upload"), {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.success === false) {
            return {
              data: null,
              error: buildError(payload?.error?.message || payload?.message || "Upload failed."),
            };
          }

          const publicUrl = payload.url || payload.data?.url || null;
          if (publicUrl) {
            uploadUrlCache.set(`${bucket}:${path}`, publicUrl);
          }

          return {
            data: {
              path,
              fullPath: payload.filename || path,
            },
            error: null,
          };
        } catch (error) {
          return {
            data: null,
            error: buildError(error instanceof Error ? error.message : "Upload failed."),
          };
        }
      },
      getPublicUrl(path: string) {
        const publicUrl = uploadUrlCache.get(`${bucket}:${path}`) || "";
        return {
          data: {
            publicUrl,
          },
        };
      },
      async createSignedUrl(path: string) {
        const signedUrl = uploadUrlCache.get(`${bucket}:${path}`) || "";
        return {
          data: {
            signedUrl,
          },
          error: null,
        };
      },
      async remove(paths: string[]) {
        paths.forEach((path) => uploadUrlCache.delete(`${bucket}:${path}`));
        return { data: null, error: null };
      },
    };
  },
};

class CompatChannel {
  on(..._args: unknown[]) {
    return this;
  }

  subscribe(..._args: unknown[]) {
    return this;
  }

  async send(_payload?: unknown) {
    return { error: null };
  }
}

export const supabase: any = {
  auth,
  from<T = unknown>(table: string) {
    return new CompatQueryBuilder<T>(table);
  },
  storage,
  functions: {
    async invoke<T = unknown>(name: string, options?: { body?: unknown }) {
      const response = await postJson<T>(`/compat/functions/${name}`, options?.body ?? {}, true);
      return {
        data: response.data,
        error: response.error,
      };
    },
  },
  channel(_name: string) {
    return new CompatChannel();
  },
  removeChannel(_channel?: unknown) {
    return null;
  },
};
