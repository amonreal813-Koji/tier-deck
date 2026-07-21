import { create } from 'zustand';

import { storage } from './storage';

/**
 * Tier Deck Pro entitlement.
 *
 * Deliberately a single local flag for now: the perks are cosmetic (no
 * watermark, custom tier colors, private lists), so there's nothing worth
 * protecting server-side yet, and this keeps payments entirely out of the app
 * until Stripe is wired. When billing lands, `hydrate` is the one place to
 * swap in a real entitlement check — nothing else needs to change.
 */

const PRO_KEY = 'pro:active:v1';

interface ProState {
  isPro: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Manual toggle — the owner's switch until real billing exists. */
  setPro: (on: boolean) => Promise<void>;
}

export const usePro = create<ProState>((set) => ({
  isPro: false,
  hydrated: false,

  hydrate: async () => {
    const active = await storage.get<boolean>(PRO_KEY);
    set({ isPro: !!active, hydrated: true });
  },

  setPro: async (on) => {
    set({ isPro: on });
    await storage.set(PRO_KEY, on);
  },
}));
