import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isNativePlatform } from "@/lib/capacitor/platform";
import { initPushNotifications, removePushToken } from "@/lib/capacitor/push-notifications";
import { initDeepLinks, getNotificationRoute } from "@/lib/capacitor/deep-links";

/**
 * Hook to initialize all Capacitor native services
 * Must be used inside a Router context
 */
export function useCapacitorInit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialized = useRef(false);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isNativePlatform() || initialized.current) return;
    initialized.current = true;

    // Initialize deep links
    initDeepLinks((path) => {
      navigate(path);
    });
  }, [navigate]);

  useEffect(() => {
    if (!isNativePlatform() || !initialized.current) return;

    const currentUserId = user?.id || null;

    if (currentUserId && previousUserId.current !== currentUserId) {
      void initPushNotifications((data) => {
        const route = getNotificationRoute(data);
        navigate(route);
      });
    } else if (!currentUserId && previousUserId.current) {
      void removePushToken();
    }

    previousUserId.current = currentUserId;
  }, [navigate, user?.id]);
}
