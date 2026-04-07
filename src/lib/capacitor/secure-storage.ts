import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

/**
 * Secure Storage wrapper using Capacitor Preferences
 * On native: uses Android SharedPreferences (encrypted by default on API 23+)
 * On web: falls back to localStorage
 */

const PREFIX = 'tartelea_secure_';

export const SecureStorage = {
  async set(key: string, value: string): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.set({ key: PREFIX + key, value });
    } else {
      try {
        localStorage.setItem(PREFIX + key, value);
      } catch {
        // localStorage quota exceeded or unavailable
      }
    }
  },

  async get(key: string): Promise<string | null> {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key: PREFIX + key });
      return value;
    } else {
      return localStorage.getItem(PREFIX + key);
    }
  },

  async remove(key: string): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.remove({ key: PREFIX + key });
    } else {
      localStorage.removeItem(PREFIX + key);
    }
  },

  async clear(): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.clear();
    } else {
      // Only clear our prefixed keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  },
};
