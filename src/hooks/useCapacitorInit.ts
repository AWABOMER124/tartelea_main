import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isNativePlatform } from "@/lib/capacitor/platform";
import { initPushNotifications, removePushToken } from "@/lib/capacitor/push-notifications";
import { initDeepLinks, getNotificationRoute } from "@/lib/capacitor/deep-links";

/**
 * Hook to initialize all Capacitor native services
 * Must be used inside a Router context
 */
export function useCapacitorInit() {
  const navigate = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isNativePlatform() || initialized.current) return;
    initialized.current = true;

    // Initialize deep links
    initDeepLinks((path) => {
      navigate(path);
    });

    // Initialize push notifications
    const setupPush = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await initPushNotifications((data) => {
          const route = getNotificationRoute(data);
          navigate(route);
        });
      }
    };

    setupPush();

    // Listen for auth state changes to register/unregister push
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await initPushNotifications((data) => {
          const route = getNotificationRoute(data);
          navigate(route);
        });
      } else if (event === 'SIGNED_OUT') {
        await removePushToken();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
}
