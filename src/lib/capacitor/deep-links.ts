import { App, URLOpenListenerEvent } from '@capacitor/app';
import { isNativePlatform } from './platform';

/**
 * Deep Linking handler for Capacitor
 * Routes incoming deep links to the appropriate page
 */

type DeepLinkHandler = (path: string) => void;

export function initDeepLinks(navigate: DeepLinkHandler): void {
  if (!isNativePlatform()) return;

  // Handle deep links when app is opened via URL
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const url = new URL(event.url);
    const path = url.pathname;

    // Handle OAuth callback
    if (path.includes('/~oauth') || url.hash.includes('access_token')) {
      // OAuth redirect - let Supabase handle it
      return;
    }

    // Route to the appropriate page
    if (path && path !== '/') {
      navigate(path);
    }
  });

  // Handle app state changes (background -> foreground)
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      // App came to foreground - could refresh data here
      console.log('App resumed');
    }
  });

  // Handle back button on Android
  App.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      App.minimizeApp();
    } else {
      window.history.back();
    }
  });
}

/**
 * Parse notification data to determine navigation target
 */
export function getNotificationRoute(data: Record<string, string>): string {
  const type = data.type;
  const postId = data.related_post_id;
  const courseId = data.related_course_id;

  switch (type) {
    case 'comment':
    case 'reaction':
      return postId ? `/community/${postId}` : '/community';
    case 'new_subscriber':
    case 'course_comment':
    case 'certificate_issued':
    case 'chat_message':
      return courseId ? `/courses/${courseId}` : '/courses';
    case 'new_message':
      return '/profile'; // messages are in profile
    case 'new_booking':
    case 'booking_update':
      return '/bookings';
    case 'new_workshop':
      return '/workshops';
    case 'new_room':
      return '/rooms';
    case 'recording_available':
      return '/workshop-recordings';
    default:
      return '/';
  }
}
