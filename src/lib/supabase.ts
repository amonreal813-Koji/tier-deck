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

/**
 * The app owner's Supabase user id. Owner-only controls (e.g. editing curated
 * lists) check the signed-in user against this. Not a secret — it only gates
 * cosmetic local edits, and RLS is the real security boundary everywhere else.
 */
export const OWNER_ID = process.env.EXPO_PUBLIC_OWNER_ID ?? '7b32164f-1891-46d7-b738-970446bda9ef';

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
