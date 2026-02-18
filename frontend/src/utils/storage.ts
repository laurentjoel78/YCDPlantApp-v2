/**
 * MMKV Storage - 10x faster than AsyncStorage
 * Drop-in replacement with AsyncStorage-compatible API
 */

import { createMMKV, type MMKV } from 'react-native-mmkv';

// Create the storage instance using the new v4 API
export const storage: MMKV = createMMKV({
  id: 'ycd-app-storage',
  encryptionKey: 'ycd-secure-key-2026', // Optional encryption
});

/**
 * AsyncStorage-compatible wrapper for easy migration
 * Use this to replace AsyncStorage imports
 */
export const MMKVStorage = {
  /**
   * Get a string value
   */
  getItem: (key: string): Promise<string | null> => {
    return Promise.resolve(storage.getString(key) ?? null);
  },

  /**
   * Set a string value
   */
  setItem: (key: string, value: string): Promise<void> => {
    storage.set(key, value);
    return Promise.resolve();
  },

  /**
   * Remove a value
   */
  removeItem: (key: string): Promise<void> => {
    storage.remove(key);
    return Promise.resolve();
  },

  /**
   * Get all keys
   */
  getAllKeys: (): Promise<string[]> => {
    return Promise.resolve(storage.getAllKeys());
  },

  /**
   * Clear all storage
   */
  clear: (): Promise<void> => {
    storage.clearAll();
    return Promise.resolve();
  },

  /**
   * Multi-get values
   */
  multiGet: (keys: string[]): Promise<[string, string | null][]> => {
    const result: [string, string | null][] = keys.map(key => [
      key,
      storage.getString(key) ?? null,
    ]);
    return Promise.resolve(result);
  },

  /**
   * Multi-set values
   */
  multiSet: (keyValuePairs: [string, string][]): Promise<void> => {
    keyValuePairs.forEach(([key, value]) => {
      storage.set(key, value);
    });
    return Promise.resolve();
  },

  /**
   * Multi-remove values
   */
  multiRemove: (keys: string[]): Promise<void> => {
    keys.forEach(key => storage.remove(key));
    return Promise.resolve();
  },
};

/**
 * Direct MMKV helpers for better performance (no JSON parsing needed for primitives)
 */
export const StorageHelpers = {
  // String operations
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),

  // Number operations
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),

  // Boolean operations
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),

  // Object operations (with JSON)
  getObject: <T>(key: string): T | null => {
    const json = storage.getString(key);
    if (!json) return null;
    try {
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Check if key exists
  contains: (key: string): boolean => storage.contains(key),

  // Delete
  remove: (key: string): void => { storage.remove(key); },

  // Clear all
  clearAll: (): void => storage.clearAll(),
};

export default MMKVStorage;
