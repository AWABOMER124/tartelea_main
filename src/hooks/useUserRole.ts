import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";
import {
  getPrimaryPlatformRole,
  normalizePlatformRoles,
} from "@/lib/platformRoles";
import { getBackendSessionUser } from "@/lib/backendSession";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const backendUser = getBackendSessionUser();
  const backendRoleKey = JSON.stringify(backendUser?.roles ?? [backendUser?.role ?? null]);

  useEffect(() => {
    if (authLoading) return;

    if (backendUser?.roles?.length) {
      const backendRoles = normalizePlatformRoles(backendUser.roles, "member") as AppRole[];
      setRoles(backendRoles);
      setPrimaryRole(getPrimaryPlatformRole(backendRoles, "member") as AppRole);
      setLoading(false);
      return;
    }

    if (!user) {
      setRoles([]);
      setPrimaryRole(null);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesData && rolesData.length > 0) {
        const userRoles = normalizePlatformRoles(rolesData.map((r) => r.role), "member") as AppRole[];
        setRoles(userRoles);

        setPrimaryRole(getPrimaryPlatformRole(userRoles, "member") as AppRole);
      } else {
        setRoles(["member"]);
        setPrimaryRole("member");
      }
      
      setLoading(false);
    };

    fetchRoles();
  }, [backendRoleKey, backendUser?.id, user, authLoading]);

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator") || isAdmin;
  const isTrainer = hasRole("trainer") || isModerator;
  const isMember = hasRole("member") || isTrainer;
  const isTrainerAndModerator = hasRole("trainer") && (hasRole("moderator") || hasRole("admin"));

  return { 
    role: primaryRole,
    roles,
    loading: loading || authLoading, 
    userId: backendUser?.id || user?.id || null, 
    isAdmin, 
    isModerator, 
    isTrainer, 
    isMember,
    hasRole,
    isTrainerAndModerator
  };
};
