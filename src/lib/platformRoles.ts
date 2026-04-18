/**
 * ADR-001: Backend First Architecture
 *
 * The backend owns the official application role model.
 * Web still reads some transitional Supabase role rows, so this adapter keeps
 * legacy aliases normalized until the full migration lands.
 */

export const PLATFORM_ROLES = ["guest", "member", "trainer", "moderator", "admin"] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const ROLE_PRIORITY: PlatformRole[] = ["admin", "moderator", "trainer", "member", "guest"];

const LEGACY_ROLE_ALIASES: Record<string, PlatformRole> = {
  student: "member",
  member: "member",
  guest: "guest",
  trainer: "trainer",
  moderator: "moderator",
  admin: "admin",
};

export const normalizePlatformRole = (
  role: string | null | undefined,
  fallback: PlatformRole = "guest",
): PlatformRole => {
  if (!role) {
    return fallback;
  }

  return LEGACY_ROLE_ALIASES[String(role).trim().toLowerCase()] ?? fallback;
};

export const normalizePlatformRoles = (
  roles: Array<string | null | undefined> | null | undefined,
  fallback: PlatformRole = "guest",
): PlatformRole[] => {
  const normalized = (roles ?? [])
    .map((role) => normalizePlatformRole(role, fallback))
    .filter(Boolean);

  if (normalized.length === 0) {
    return [fallback];
  }

  return [...new Set(normalized)];
};

export const getPrimaryPlatformRole = (
  roles: Array<string | null | undefined> | null | undefined,
  fallback: PlatformRole = "guest",
): PlatformRole => {
  const normalized = normalizePlatformRoles(roles, fallback);

  for (const role of ROLE_PRIORITY) {
    if (normalized.includes(role)) {
      return role;
    }
  }

  return fallback;
};
