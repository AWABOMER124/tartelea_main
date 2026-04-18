import type { BackendAuthSession, BackendContractUser } from "./backendAuthContract";

export const BACKEND_ACCESS_TOKEN_KEY = "tartelea_backend_access_token";
export const BACKEND_REFRESH_TOKEN_KEY = "tartelea_backend_refresh_token";
export const BACKEND_USER_KEY = "tartelea_backend_user";
export const BACKEND_SESSION_EVENT = "tartelea:backend-session-changed";

const safeStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const getBackendAccessToken = (): string | null => {
  return safeStorage()?.getItem(BACKEND_ACCESS_TOKEN_KEY) ?? null;
};

export const getBackendRefreshToken = (): string | null => {
  return safeStorage()?.getItem(BACKEND_REFRESH_TOKEN_KEY) ?? null;
};

export const getBackendSessionUser = (): BackendContractUser | null => {
  const raw = safeStorage()?.getItem(BACKEND_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BackendContractUser;
  } catch {
    return null;
  }
};

export const getStoredBackendSession = (): BackendAuthSession => ({
  user: getBackendSessionUser(),
  accessToken: getBackendAccessToken(),
  refreshToken: getBackendRefreshToken(),
});

const emitBackendSessionEvent = (event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED"): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(BACKEND_SESSION_EVENT, {
      detail: {
        event,
        session: getStoredBackendSession(),
      },
    }),
  );
};

export const setBackendSession = (session: BackendAuthSession): void => {
  const storage = safeStorage();

  if (!storage) {
    return;
  }

  if (session.accessToken) {
    storage.setItem(BACKEND_ACCESS_TOKEN_KEY, session.accessToken);
  } else {
    storage.removeItem(BACKEND_ACCESS_TOKEN_KEY);
  }

  if (session.refreshToken) {
    storage.setItem(BACKEND_REFRESH_TOKEN_KEY, session.refreshToken);
  } else {
    storage.removeItem(BACKEND_REFRESH_TOKEN_KEY);
  }

  if (session.user) {
    storage.setItem(BACKEND_USER_KEY, JSON.stringify(session.user));
  } else {
    storage.removeItem(BACKEND_USER_KEY);
  }

  emitBackendSessionEvent(session.accessToken || session.user ? "SIGNED_IN" : "SIGNED_OUT");
};

export const clearBackendSession = (): void => {
  const storage = safeStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(BACKEND_ACCESS_TOKEN_KEY);
  storage.removeItem(BACKEND_REFRESH_TOKEN_KEY);
  storage.removeItem(BACKEND_USER_KEY);
  emitBackendSessionEvent("SIGNED_OUT");
};

export const hasBackendSession = (): boolean => {
  return Boolean(getBackendAccessToken());
};
