import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { isCommunityEnabled, supabase } from '@/lib/supabase';

interface AuthState {
  /** True once the initial session check has resolved (or immediately if no backend). */
  ready: boolean;
  session: Session | null;
  user: User | null;
  /** Kick off session restore + auth-change subscription. Call once at app start. */
  init: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Where OAuth returns to after Google/Apple.
 *
 * Web: the exact page the user signed in from. Don't hardcode a path here —
 * the production export is served under the /app base URL while the dev server
 * serves the same routes at the root, so origin + pathname is the only form
 * that lands correctly in both. Native: a deep link back into the app.
 */
function redirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return 'tierdeck://app';
}

export const useAuth = create<AuthState>((set) => ({
  ready: !isCommunityEnabled, // no backend → nothing to wait for
  session: null,
  user: null,

  init: () => {
    if (!supabase) {
      set({ ready: true });
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => set({ session: data.session, user: data.session?.user ?? null, ready: true }))
      .catch(() => set({ ready: true }));
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signInWithGoogle: async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    });
  },

  signOut: async () => {
    await supabase?.auth.signOut();
  },
}));
