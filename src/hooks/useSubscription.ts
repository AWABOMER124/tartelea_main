import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string | null;
  status: string;
  started_at: string | null;
  expires_at: string | null;
}

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    checkSubscription();
  }, [user, authLoading]);

  const checkSubscription = async () => {
    try {
      if (!user) {
        setHasSubscription(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("monthly_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      } else if (data) {
        const isActive = new Date(data.expires_at) > new Date();
        setHasSubscription(isActive);
        setSubscription(data);
      } else {
        setHasSubscription(false);
      }
    } catch (error) {
      console.error("Subscription check error:", error);
      setHasSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  const verifySubscription = async (subscriptionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("paypal-subscription", {
        body: { action: "verify", subscriptionId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.success && response.data.active) {
        await checkSubscription();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Verify subscription error:", error);
      return false;
    }
  };

  return {
    hasSubscription,
    subscription,
    loading: loading || authLoading,
    checkSubscription,
    verifySubscription,
  };
};

// Discount constant
export const SUBSCRIPTION_DISCOUNT = 0.25; // 25% discount
