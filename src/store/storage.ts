import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin storage facade. Everything above this file speaks get/set/remove —
 * swapping AsyncStorage for MMKV after moving to a dev build is a
 * one-file change.
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw == null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Persistence is best-effort; the in-memory store stays authoritative.
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch {
      return [];
    }
  },
};
