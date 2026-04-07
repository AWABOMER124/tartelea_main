import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

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
        const userRoles = rolesData.map(r => r.role);
        setRoles(userRoles);
        
        const roleHierarchy: AppRole[] = ["admin", "moderator", "trainer", "member", "guest"];
        const highestRole = roleHierarchy.find(r => userRoles.includes(r)) || "guest";
        setPrimaryRole(highestRole);
      } else {
        setRoles(["guest"]);
        setPrimaryRole("guest");
      }
      
      setLoading(false);
    };

    fetchRoles();
  }, [user, authLoading]);

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
    userId: user?.id || null, 
    isAdmin, 
    isModerator, 
    isTrainer, 
    isMember,
    hasRole,
    isTrainerAndModerator
  };
};
