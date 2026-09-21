import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client singleton.
 * AsyncStorage is used so auth sessions persist across app restarts.
 * The anon key is safe to expose — RLS policies enforce data access.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; display_name: string | null; created_at: string };
        Insert: { id: string; display_name?: string | null };
        Update: { display_name?: string | null };
      };
      reading_progress: {
        Row: {
          user_id: string;
          surah_number: number;
          ayah_number: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          surah_number: number;
          ayah_number: number;
        };
        Update: {
          surah_number?: number;
          ayah_number?: number;
          updated_at?: string;
        };
      };
      circles: {
        Row: {
          id: string;
          name: string;
          collective_streak: number;
          created_by: string;
          created_at: string;
        };
      };
      circle_members: {
        Row: { circle_id: string; user_id: string; joined_at: string };
      };
      niyyahs: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          intention_text: string;
          created_at: string;
        };
      };
    };
  };
};
