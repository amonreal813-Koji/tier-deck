import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import type { Tier, TierList } from '@/data/types';

import { useListsStore } from './useListsStore';

/** Structural snapshot — item payloads never change during a session. */
interface Snapshot {
  tiers: Tier[];
  unrankedIds: string[];
}

export const UNRANKED_ZONE = 'unranked';

interface EditorState {
  list: TierList | null;
  past: Snapshot[];
  future: Snapshot[];
  /** Tap-to-place selection (also the accessibility path). */
  selectedItemId: string | null;
  /** Bumps on every save so the header dot can pulse. */
  saveNonce: number;

  open: (list: TierList) => void;
  close: () => void;
  select: (itemId: string | null) => void;

  setTitle: (title: string) => void;
  moveItem: (itemId: string, toZone: string, index?: number) => void;
  /** Reorder an item left/right within whatever zone currently holds it. */
  moveWithinZone: (itemId: string, direction: -1 | 1) => void;
  removeItem: (itemId: string) => void;
  renameTier: (tierId: string, label: string) => void;
  recolorTier: (tierId: string, color: string) => void;
  addTier: () => void;
  removeTier: (tierId: string) => void;
  moveTier: (tierId: string, direction: -1 | 1) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function snapshot(list: TierList): Snapshot {
  return {
    tiers: list.tiers.map((t) => ({ ...t, itemIds: [...t.itemIds] })),
    unrankedIds: [...list.unrankedIds],
  };
}

/** Pull an item id out of whatever zone currently holds it. */
function extract(list: TierList, itemId: string): TierList {
  return {
    ...list,
    tiers: list.tiers.map((t) => ({ ...t, itemIds: t.itemIds.filter((id) => id !== itemId) })),
    unrankedIds: list.unrankedIds.filter((id) => id !== itemId),
  };
}

export const useEditorStore = create<EditorState>((set, get) => {
  /** Apply a structural mutation with history + persistence. */
  function commit(fn: (list: TierList) => TierList) {
    const { list, past } = get();
    if (!list) return;
    const next = fn(list);
    if (next === list) return;
    set({
      list: next,
      past: [...past.slice(-49), snapshot(list)],
      future: [],
      saveNonce: get().saveNonce + 1,
    });
    useListsStore.getState().upsertList(next);
  }

  return {
    list: null,
    past: [],
    future: [],
    selectedItemId: null,
    saveNonce: 0,

    open: (list) => set({ list, past: [], future: [], selectedItemId: null }),
    close: () => set({ list: null, past: [], future: [], selectedItemId: null }),
    select: (itemId) => set({ selectedItemId: itemId }),

    setTitle: (title) => {
      // Title edits skip the undo stack — undo is for board structure.
      const { list } = get();
      if (!list || list.title === title) return;
      const next = { ...list, title };
      set({ list: next, saveNonce: get().saveNonce + 1 });
      useListsStore.getState().upsertList(next);
    },

    moveItem: (itemId, toZone, index) => {
      commit((list) => {
        const cleared = extract(list, itemId);
        if (toZone === UNRANKED_ZONE) {
          const ids = [...cleared.unrankedIds];
          ids.splice(index ?? ids.length, 0, itemId);
          return { ...cleared, unrankedIds: ids };
        }
        const tierIdx = cleared.tiers.findIndex((t) => t.id === toZone);
        if (tierIdx === -1) return list;
        const tiers = [...cleared.tiers];
        const ids = [...tiers[tierIdx].itemIds];
        ids.splice(index ?? ids.length, 0, itemId);
        tiers[tierIdx] = { ...tiers[tierIdx], itemIds: ids };
        return { ...cleared, tiers };
      });
      set({ selectedItemId: null });
    },

    moveWithinZone: (itemId, direction) => {
      const swap = (arr: string[]): string[] | null => {
        const i = arr.indexOf(itemId);
        const target = i + direction;
        if (i === -1 || target < 0 || target >= arr.length) return null;
        const next = [...arr];
        [next[i], next[target]] = [next[target], next[i]];
        return next;
      };
      commit((list) => {
        const tierIdx = list.tiers.findIndex((t) => t.itemIds.includes(itemId));
        if (tierIdx !== -1) {
          const next = swap(list.tiers[tierIdx].itemIds);
          if (!next) return list;
          const tiers = [...list.tiers];
          tiers[tierIdx] = { ...tiers[tierIdx], itemIds: next };
          return { ...list, tiers };
        }
        const next = swap(list.unrankedIds);
        return next ? { ...list, unrankedIds: next } : list;
      });
    },

    removeItem: (itemId) => {
      commit((list) => {
        const cleared = extract(list, itemId);
        const { [itemId]: _gone, ...items } = cleared.items;
        return { ...cleared, items };
      });
      set({ selectedItemId: null });
    },

    renameTier: (tierId, label) =>
      commit((list) => ({
        ...list,
        tiers: list.tiers.map((t) => (t.id === tierId ? { ...t, label } : t)),
      })),

    recolorTier: (tierId, color) =>
      commit((list) => ({
        ...list,
        tiers: list.tiers.map((t) => (t.id === tierId ? { ...t, color } : t)),
      })),

    addTier: () =>
      commit((list) => ({
        ...list,
        tiers: [
          ...list.tiers,
          { id: Crypto.randomUUID(), label: 'New', color: '#94A3B8', itemIds: [] },
        ],
      })),

    removeTier: (tierId) =>
      commit((list) => {
        const tier = list.tiers.find((t) => t.id === tierId);
        if (!tier) return list;
        // Items fall back to the unranked pool, never deleted.
        return {
          ...list,
          tiers: list.tiers.filter((t) => t.id !== tierId),
          unrankedIds: [...list.unrankedIds, ...tier.itemIds],
        };
      }),

    moveTier: (tierId, direction) =>
      commit((list) => {
        const idx = list.tiers.findIndex((t) => t.id === tierId);
        const target = idx + direction;
        if (idx === -1 || target < 0 || target >= list.tiers.length) return list;
        const tiers = [...list.tiers];
        [tiers[idx], tiers[target]] = [tiers[target], tiers[idx]];
        return { ...list, tiers };
      }),

    undo: () => {
      const { list, past, future } = get();
      if (!list || past.length === 0) return;
      const prev = past[past.length - 1];
      set({
        list: { ...list, tiers: prev.tiers, unrankedIds: prev.unrankedIds },
        past: past.slice(0, -1),
        future: [...future, snapshot(list)],
        saveNonce: get().saveNonce + 1,
      });
      useListsStore.getState().upsertList(get().list!);
    },

    redo: () => {
      const { list, past, future } = get();
      if (!list || future.length === 0) return;
      const next = future[future.length - 1];
      set({
        list: { ...list, tiers: next.tiers, unrankedIds: next.unrankedIds },
        future: future.slice(0, -1),
        past: [...past, snapshot(list)],
        saveNonce: get().saveNonce + 1,
      });
      useListsStore.getState().upsertList(get().list!);
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});
