import { Platform } from 'react-native';
import { createMMKV, type MMKV } from 'react-native-mmkv';

// Storage interface
interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Web storage implementation using localStorage
const webStorage: StorageInterface = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

// MMKV instance for mobile (much faster than AsyncStorage)
let mmkvInstance: MMKV | null = null;

const getMMKVInstance = (): MMKV => {
  if (!mmkvInstance) {
    mmkvInstance = createMMKV({
      id: 'imobil-storage',
      encryptionKey: 'imobil-secure-key-2024',
    });
  }
  return mmkvInstance;
};

// MMKV storage implementation (mobile only)
const mmkvStorage: StorageInterface = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const mmkv = getMMKVInstance();
      return mmkv.getString(key) ?? null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const mmkv = getMMKVInstance();
      mmkv.set(key, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const mmkv = getMMKVInstance();
      mmkv.remove(key);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  },
};

// Export the appropriate storage based on platform
// Web: localStorage
// Mobile: MMKV (much faster, encrypted)
export const storage: StorageInterface = Platform.OS === 'web' ? webStorage : mmkvStorage;

// Synchronous access for MMKV (mobile only)
export const getStorageSync = {
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    const mmkv = getMMKVInstance();
    return mmkv.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Storage setItem error:', error);
      }
      return;
    }
    const mmkv = getMMKVInstance();
    mmkv.set(key, value);
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Storage removeItem error:', error);
      }
      return;
    }
    const mmkv = getMMKVInstance();
    mmkv.remove(key);
  },
};

// Convenient hook for components
export const useStorage = () => storage;

export default storage;
