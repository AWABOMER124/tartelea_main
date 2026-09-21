import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";
import {
  getPrimaryPlatformRole,
  normalizePlatformRoles,
} from "@/lib/platformRoles";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();

  const roles = useMemo<AppRole[]>(() => {
    if (!user) return [];
    return normalizePlatformRoles(
      user.roles?.length ? user.roles : [user.role || "member"],
      "member",
    ) as AppRole[];
  }, [user]);

  const primaryRole = useMemo<AppRole | null>(() => {
    if (!roles.length) return null;
    return getPrimaryPlatformRole(roles, "member") as AppRole;
  }, [roles]);

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator") || isAdmin;
  const isTrainer = hasRole("trainer") || isModerator;
  const isMember = hasRole("member") || isTrainer;
  const isTrainerAndModerator =
    hasRole("trainer") && (hasRole("moderator") || hasRole("admin"));

  return {
    role: primaryRole,
    roles,
    loading: authLoading,
    userId: user?.id || null,
    isAdmin,
    isModerator,
    isTrainer,
    isMember,
    hasRole,
    isTrainerAndModerator,
  };
};
