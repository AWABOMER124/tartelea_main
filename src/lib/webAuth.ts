import { backendRequest } from "./backendApi";
import type { BackendAuthResponsePayload, BackendAuthSession } from "./backendAuthContract";
import { toBackendAuthSession } from "./backendAuthContract";
import { clearBackendSession, getBackendAccessToken, setBackendSession } from "./backendSession";

type SignupPayload = {
  email: string;
  password: string;
  full_name?: string;
  country?: string;
};

type VerifyEmailPayload = {
  email: string;
  code: string;
};

type ResetPasswordPayload = {
  otp: string;
  newPassword: string;
};

export type BackendAuthResult = {
  session: BackendAuthSession;
  payload: BackendAuthResponsePayload;
};

type ForgotPasswordResponse = {
  message?: string;
  passwordResetPending?: boolean;
  devOtp?: string;
  data?: {
    passwordResetPending?: boolean;
    devOtp?: string;
  } | null;
};

type ResetPasswordResponse = {
  message?: string;
  data?: Record<string, unknown> | null;
};

const applyBackendAuthPayload = (
  payload: BackendAuthResponsePayload,
): BackendAuthSession => {
  const session = toBackendAuthSession(payload);

  if (session.accessToken && session.user) {
    setBackendSession(session);
  }

  return session;
};

export const loginWithBackend = async (
  email: string,
  password: string,
): Promise<BackendAuthResult> => {
  const payload = await backendRequest<BackendAuthResponsePayload>("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
    attachAuthToken: false,
  });

  const session = applyBackendAuthPayload(payload);

  return {
    session,
    payload,
  };
};

export const signupWithBackend = async (
  signupData: SignupPayload,
): Promise<BackendAuthResult> => {
  const payload = await backendRequest<BackendAuthResponsePayload>("/auth/signup", {
    method: "POST",
    body: signupData,
    attachAuthToken: false,
  });

  const session = applyBackendAuthPayload(payload);

  return {
    session,
    payload,
  };
};

export const verifyEmailWithBackend = async (
  payload: VerifyEmailPayload,
  _compatibilityPassword?: string,
): Promise<BackendAuthResult> => {
  const response = await backendRequest<BackendAuthResponsePayload>("/auth/verify-email", {
    method: "POST",
    body: payload,
    attachAuthToken: false,
  });

  const session = applyBackendAuthPayload(response);

  return {
    session,
    payload: response,
  };
};

export const requestPasswordResetWithBackend = async (
  email: string,
): Promise<ForgotPasswordResponse> => {
  return backendRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: {
      email,
    },
    attachAuthToken: false,
  });
};

export const resetPasswordWithBackend = async ({
  otp,
  newPassword,
}: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
  return backendRequest<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: {
      otp,
      newPassword,
    },
    attachAuthToken: false,
  });
};

export const logoutEverywhere = async (): Promise<void> => {
  try {
    if (getBackendAccessToken()) {
      await backendRequest("/auth/logout", {
        method: "POST",
        requireAuth: true,
      });
    }
  } catch (error) {
    console.warn("[ADR-001][logout] backend logout failed", error);
  } finally {
    clearBackendSession();
  }
};
