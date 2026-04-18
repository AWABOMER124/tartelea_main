import { useEffect, useState } from "react";
import { backendRequest } from "@/lib/backendApi";
import {
  BACKEND_SESSION_EVENT,
  getBackendAccessToken,
} from "@/lib/backendSession";

export interface BackendEntitlementAccess {
  canAccessLibrary: boolean;
  canAccessFullLibrary: boolean;
  canJoinRoom: boolean;
  canJoinPremiumRoom: boolean;
  canCreateRoom: boolean;
  canAskQuestion: boolean;
  canGetDiscount: boolean;
}

interface BackendEntitlementsPayload {
  entitlements: string[];
  scoped_course_ids: string[];
  access: BackendEntitlementAccess;
  role_overrides: {
    trainer: boolean;
    admin: boolean;
  };
}

const defaultAccess: BackendEntitlementAccess = {
  canAccessLibrary: false,
  canAccessFullLibrary: false,
  canJoinRoom: false,
  canJoinPremiumRoom: false,
  canCreateRoom: false,
  canAskQuestion: false,
  canGetDiscount: false,
};

export const useBackendEntitlements = () => {
  const [payload, setPayload] = useState<BackendEntitlementsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) {
        setLoading(true);
      }

      const token = getBackendAccessToken();
      if (!token) {
        if (!cancelled) {
          setPayload(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await backendRequest<BackendEntitlementsPayload>("/entitlements/me", {
          requireAuth: true,
        });

        if (!cancelled) {
          setPayload(response);
        }
      } catch (error) {
        console.warn("[entitlements] failed to load backend entitlements", error);
        if (!cancelled) {
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    const handleSessionChange = () => {
      void load();
    };

    window.addEventListener(BACKEND_SESSION_EVENT, handleSessionChange);

    return () => {
      cancelled = true;
      window.removeEventListener(BACKEND_SESSION_EVENT, handleSessionChange);
    };
  }, []);

  return {
    entitlements: payload?.entitlements || [],
    scopedCourseIds: payload?.scoped_course_ids || [],
    access: payload?.access || defaultAccess,
    roleOverrides: payload?.role_overrides || { trainer: false, admin: false },
    loading,
  };
};
