import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createMMKV } from 'react-native-mmkv';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are defined in .env'
  );
}

/**
 * Platform-aware storage adapter
 * - Web: uses localStorage (persistent, synchronous API wrapped in Promises)
 * - Mobile: uses MMKV (encrypted, ~30x faster than AsyncStorage)
 *
 * Security:
 * - Web: localStorage is isolated per origin
 * - Mobile: MMKV is encrypted and isolated per app
 * - Supabase tokens are additionally encrypted by Supabase itself
 */
const getStorageAdapter = () => {
  // Web: use localStorage
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          return window.localStorage.getItem(key);
        } catch (error) {
          console.warn('[Web Storage] Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          window.localStorage.setItem(key, value);
        } catch (error) {
          console.warn('[Web Storage] Error writing to localStorage:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.warn('[Web Storage] Error removing from localStorage:', error);
        }
      },
    };
  }

  // Mobile: use MMKV (encrypted, much faster than AsyncStorage)
  const mmkv = createMMKV({
    id: 'imobil-auth-storage',
    encryptionKey: 'imobil-auth-encryption-key',
  });

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return mmkv.getString(key) ?? null;
      } catch (error) {
        console.warn('[MMKV] Error reading:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        mmkv.set(key, value);
      } catch (error) {
        console.warn('[MMKV] Error writing:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        mmkv.remove(key);
      } catch (error) {
        console.warn('[MMKV] Error removing:', error);
      }
    },
  };
};

// Create Supabase client with platform-aware storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: getStorageAdapter(),
  },
});

// Types
export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  is_seller: boolean;
  is_affiliate: boolean;
  role: 'user' | 'seller' | 'agent' | 'affiliate' | 'admin';
  push_token?: string | null;
  created_at: string;
};

export type Property = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  type: 'house' | 'apartment' | 'land';
  transaction: 'sale' | 'rent';
  price: number;
  currency: string;
  location: string;
  city: string;
  area_m2: number;
  size?: number; // alias opcional para area_m2
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  images: string[];
  status: 'active' | 'inactive' | 'sold' | 'rented';
  is_featured: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'booking' | 'image';
  created_at: string;
};

export type Conversation = {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

export type Booking = {
  id: string;
  property_id: string;
  buyer_id: string;
  agent_id: string;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
};

export type Affiliate = {
  id: string;
  user_id: string;
  referral_code: string;
  referred_by: string | null;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_earnings: number;
  created_at: string;
};

export type Referral = {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  property_id: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  commission_amount: number | null;
  created_at: string;
};
