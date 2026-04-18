import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { backendRequest } from "@/lib/backendApi";
import { BACKEND_SESSION_EVENT } from "@/lib/backendSession";

interface SubscriptionAccess {
  canAccessLibrary: boolean;
  canAccessFullLibrary: boolean;
  canJoinRoom: boolean;
  canJoinPremiumRoom: boolean;
  canCreateRoom: boolean;
  canAskQuestion: boolean;
  canGetDiscount: boolean;
}

interface SubscriptionContract {
  plan: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  entitlements: string[];
  scoped_course_ids: string[];
  access: SubscriptionAccess;
  discounts?: {
    courses_percent?: number;
  };
  role_overrides?: {
    trainer?: boolean;
    admin?: boolean;
  };
}

interface LegacySubscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string | null;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  plan: string;
  source?: string | null;
}

const defaultAccess: SubscriptionAccess = {
  canAccessLibrary: false,
  canAccessFullLibrary: false,
  canJoinRoom: false,
  canJoinPremiumRoom: false,
  canCreateRoom: false,
  canAskQuestion: false,
  canGetDiscount: false,
};

export const SUBSCRIPTION_DISCOUNT = 0.25;

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState<LegacySubscription | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [status, setStatus] = useState<string>("inactive");
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [scopedCourseIds, setScopedCourseIds] = useState<string[]>([]);
  const [access, setAccess] = useState<SubscriptionAccess>(defaultAccess);
  const [roleOverrides, setRoleOverrides] = useState({ trainer: false, admin: false });
  const [discountPercent, setDiscountPercent] = useState(SUBSCRIPTION_DISCOUNT);
  const [loading, setLoading] = useState(true);

  const resetState = useCallback(() => {
    setHasSubscription(false);
    setSubscription(null);
    setPlan("free");
    setStatus("inactive");
    setEntitlements([]);
    setScopedCourseIds([]);
    setAccess(defaultAccess);
    setRoleOverrides({ trainer: false, admin: false });
    setDiscountPercent(SUBSCRIPTION_DISCOUNT);
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      resetState();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await backendRequest<SubscriptionContract>("/subscriptions/me", {
        requireAuth: true,
      });

      const normalizedDiscount =
        typeof response.discounts?.courses_percent === "number"
          ? response.discounts.courses_percent / 100
          : SUBSCRIPTION_DISCOUNT;
      const isMonthlyActive = response.plan === "monthly" && response.status === "active";

      setPlan(response.plan || "free");
      setStatus(response.status || "inactive");
      setEntitlements(response.entitlements || []);
      setScopedCourseIds(response.scoped_course_ids || []);
      setAccess(response.access || defaultAccess);
      setRoleOverrides({
        trainer: Boolean(response.role_overrides?.trainer),
        admin: Boolean(response.role_overrides?.admin),
      });
      setDiscountPercent(normalizedDiscount);
      setHasSubscription(isMonthlyActive);
      setSubscription(
        isMonthlyActive
          ? {
              id: `${user.id}:${response.plan}`,
              user_id: user.id,
              paypal_subscription_id: null,
              status: response.status,
              started_at: response.starts_at || null,
              expires_at: response.ends_at || null,
              plan: response.plan,
              source: null,
            }
          : null,
      );
    } catch (error) {
      console.error("Subscription check error:", error);
      resetState();
    } finally {
      setLoading(false);
    }
  }, [resetState, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void checkSubscription();
  }, [authLoading, checkSubscription]);

  useEffect(() => {
    const handleSessionChange = () => {
      void checkSubscription();
    };

    window.addEventListener(BACKEND_SESSION_EVENT, handleSessionChange);

    return () => {
      window.removeEventListener(BACKEND_SESSION_EVENT, handleSessionChange);
    };
  }, [checkSubscription]);

  const verifySubscription = useCallback(
    async (subscriptionId: string) => {
      try {
        const response = await backendRequest<{ active?: boolean }>("/compat/functions/paypal-subscription", {
          method: "POST",
          body: { action: "verify", subscriptionId },
          requireAuth: true,
        });

        if (response.active) {
          await checkSubscription();
          return true;
        }

        return false;
      } catch (error) {
        console.error("Verify subscription error:", error);
        return false;
      }
    },
    [checkSubscription],
  );

  return {
    hasSubscription,
    hasPremiumAccess:
      access.canAccessFullLibrary ||
      access.canJoinPremiumRoom ||
      roleOverrides.admin ||
      roleOverrides.trainer,
    canGetDiscount: access.canGetDiscount,
    discountPercent,
    subscription,
    plan,
    status,
    entitlements,
    scopedCourseIds,
    access,
    roleOverrides,
    loading: loading || authLoading,
    checkSubscription,
    verifySubscription,
  };
};
