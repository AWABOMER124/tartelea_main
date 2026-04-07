import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { isNativePlatform } from './platform';

/**
 * Background Audio service for Capacitor
 * Keeps audio rooms alive when the app is minimized
 */

let isEnabled = false;

/**
 * Enable background mode to keep audio playing when app is minimized
 */
export async function enableBackgroundAudio(): Promise<void> {
  if (!isNativePlatform() || isEnabled) return;

  try {
    await BackgroundMode.enable({
      title: 'ترتيلة',
      text: 'الغرفة الصوتية نشطة',
      icon: 'ic_launcher',
      color: '#F2EDE4',
      resume: true,
      silent: false,
      hidden: false,
      channelName: 'غرفة صوتية',
      channelDescription: 'إشعار الغرفة الصوتية النشطة',
    });

    isEnabled = true;
    console.log('Background audio mode enabled');
  } catch (error) {
    console.error('Failed to enable background audio:', error);
  }
}

/**
 * Disable background mode when leaving an audio room
 */
export async function disableBackgroundAudio(): Promise<void> {
  if (!isNativePlatform() || !isEnabled) return;

  try {
    await BackgroundMode.disable();
    isEnabled = false;
    console.log('Background audio mode disabled');
  } catch (error) {
    console.error('Failed to disable background audio:', error);
  }
}

/**
 * Check if background mode is currently active
 */
export function isBackgroundAudioEnabled(): boolean {
  return isEnabled;
}
