import { create } from 'zustand';

import { storage } from './storage';

/** tier label -> ordered item ids. A complete arrangement of one list. */
export type Arrangement = Record<string, string[]>;

const KEY = 'premade-edits';

interface PremadeEditsState {
  overrides: Record<string, Arrangement>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Persist a complete edited arrangement for a curated list. */
  setArrangement: (listId: string, arrangement: Arrangement) => void;
  /** Forget edits for a list, restoring the original curated order. */
  reset: (listId: string) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const usePremadeEdits = create<PremadeEditsState>((set, get) => ({
  overrides: {},
  hydrated: false,

  hydrate: async () => {
    const saved = (await storage.get<Record<string, Arrangement>>(KEY)) ?? {};
    set({ overrides: saved, hydrated: true });
  },

  setArrangement: (listId, arrangement) => {
    set((s) => ({ overrides: { ...s.overrides, [listId]: arrangement } }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => storage.set(KEY, get().overrides), 400);
  },

  reset: (listId) => {
    set((s) => {
      const { [listId]: _drop, ...rest } = s.overrides;
      return { overrides: rest };
    });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => storage.set(KEY, get().overrides), 400);
  },
}));

/**
 * Apply a saved arrangement over the original curated tiers. Resilient to the
 * catalog changing later: items added to the catalog after an edit appear in
 * their original tier; items removed from the catalog silently drop out.
 */
export function applyArrangement<T extends { id: string }>(
  tiers: { label: string; color: string; items: T[] }[],
  arrangement: Arrangement | undefined
): { label: string; color: string; items: T[] }[] {
  if (!arrangement) return tiers;
  const byId = new Map<string, T>();
  for (const t of tiers) for (const it of t.items) byId.set(it.id, it);
  const placed = new Set<string>();
  for (const ids of Object.values(arrangement)) for (const id of ids) placed.add(id);

  return tiers.map((tier) => {
    const savedIds = arrangement[tier.label] ?? tier.items.map((i) => i.id);
    // Saved order first, then any brand-new catalog items native to this tier.
    const fresh = tier.items.filter((i) => !placed.has(i.id)).map((i) => i.id);
    const ids = [...savedIds, ...fresh];
    const items = ids.map((id) => byId.get(id)).filter((x): x is T => Boolean(x));
    return { label: tier.label, color: tier.color, items };
  });
}
