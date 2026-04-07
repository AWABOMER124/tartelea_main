import { PushNotifications } from '@capacitor/push-notifications';
import { isNativePlatform } from './platform';
import { supabase } from '@/integrations/supabase/client';

/**
 * Push Notifications service for Capacitor
 * Handles registration, token storage, and notification routing
 */

let isInitialized = false;

export async function initPushNotifications(
  onNotificationTap?: (data: Record<string, string>) => void
): Promise<void> {
  if (!isNativePlatform() || isInitialized) return;
  isInitialized = true;

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.warn('Push notification permission denied');
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // Handle registration success - save token
  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token:', token.value);
    await saveDeviceToken(token.value);
  });

  // Handle registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // Handle notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    // We don't show a local notification since the app is in foreground
    // The realtime subscription will handle updating the UI
  });

  // Handle notification action (user tapped on notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push notification action:', action);
    const data = action.notification.data as Record<string, string>;
    if (onNotificationTap && data) {
      onNotificationTap(data);
    }
  });
}

/**
 * Save device token to database
 */
async function saveDeviceToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert the token
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        platform: 'android',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

  if (error) {
    console.error('Failed to save device token:', error);
  }
}

/**
 * Remove device token on logout
 */
export async function removePushToken(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id);
    }
  } catch (error) {
    console.error('Failed to remove device token:', error);
  }
}
