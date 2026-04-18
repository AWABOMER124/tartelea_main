import type { PlatformRole } from "./platformRoles";
import {
  getPrimaryPlatformRole,
  normalizePlatformRole,
  normalizePlatformRoles,
} from "./platformRoles";

/**
 * ADR-001 transitional adapter:
 * New web integrations should target backend auth/session responses using this
 * contract, even while legacy Supabase auth remains active in the current UI.
 */

export interface BackendContractUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  role: PlatformRole;
  roles?: PlatformRole[];
  isVerified: boolean;
  status: "active" | "inactive" | "blocked";
}

export interface BackendAuthSession {
  user: BackendContractUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface LegacyBackendUser {
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  country?: string | null;
  role?: string | null;
  roles?: Array<string | null | undefined> | null;
  is_verified?: boolean | null;
  status?: "active" | "inactive" | "blocked" | null;
}

interface BackendAuthResponseData {
  user?: LegacyBackendUser | null;
  token?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface BackendAuthResponsePayload {
  user?: BackendContractUser | LegacyBackendUser | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  data?: BackendAuthResponseData | null;
}

const toContractUser = (
  input: BackendContractUser | LegacyBackendUser | null | undefined,
): BackendContractUser | null => {
  if (!input?.id) {
    return null;
  }

  const roles = normalizePlatformRoles(input.roles ?? [input.role], "member");
  const role = normalizePlatformRole(
    input.role ?? getPrimaryPlatformRole(roles, "member"),
    "member",
  );

  return {
    id: input.id,
    email: input.email ?? "",
    fullName: "fullName" in input ? input.fullName ?? null : input.full_name ?? null,
    avatarUrl: "avatarUrl" in input ? input.avatarUrl ?? null : input.avatar_url ?? null,
    bio: input.bio ?? null,
    country: input.country ?? null,
    role,
    roles,
    isVerified:
      "isVerified" in input ? Boolean(input.isVerified) : Boolean(input.is_verified),
    status: input.status ?? "active",
  };
};

export const toBackendAuthSession = (
  payload: BackendAuthResponsePayload | null | undefined,
): BackendAuthSession => {
  const data = payload?.data;
  const user = toContractUser(payload?.user ?? data?.user ?? null);

  return {
    user,
    accessToken: payload?.accessToken ?? data?.accessToken ?? data?.token ?? null,
    refreshToken: payload?.refreshToken ?? data?.refreshToken ?? null,
  };
};
