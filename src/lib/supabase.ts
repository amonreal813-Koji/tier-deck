import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the community backend (publish / browse / like).
 *
 * Both values are safe to ship in the app: the URL is public and the anon key
 * only works through Row Level Security (see supabase/schema.sql). The whole
 * community layer is OPTIONAL — if these env vars are blank, the app runs
 * exactly as before and community UI hides itself (see isCommunityEnabled).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isCommunityEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isCommunityEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // On web we complete OAuth by parsing the redirect URL; native uses a
        // deep link handled explicitly, so only web auto-detects.
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
