import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import type { Category, TierItem, TierList } from '@/data/types';
import { DEFAULT_TIERS } from '@/theme/tierColors';
import { decodeParamToDraft } from '@/utils/share';

import { storage } from './storage';

const LIST_KEY = (id: string) => `list:${id}`;
const INDEX_KEY = 'list-index';

/** Tiny summary for the home screen; the full lists hydrate alongside it. */
interface IndexEntry {
  id: string;
  title: string;
  updatedAt: number;
}

interface ListsState {
  lists: Record<string, TierList>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createList: (title: string, category: Category, items: TierItem[]) => TierList;
  /** Create a list with tiers pre-populated (used by "make it yours"). */
  importList: (
    title: string,
    category: Category,
    tiers: { label: string; color: string; items: TierItem[] }[]
  ) => TierList;
  /** Decode a shared `?d=` param into a new saved list. Null if malformed. */
  importFromEncoded: (param: string) => TierList | null;
  upsertList: (list: TierList) => void;
  deleteList: (id: string) => void;
  duplicateList: (id: string) => TierList | null;
}

const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function persistList(list: TierList) {
  // Debounced per-list writer: rapid board edits collapse into one write.
  clearTimeout(saveTimers[list.id]);
  saveTimers[list.id] = setTimeout(() => {
    storage.set(LIST_KEY(list.id), list);
  }, 500);
}

function persistIndex(lists: Record<string, TierList>) {
  const index: IndexEntry[] = Object.values(lists).map((l) => ({
    id: l.id,
    title: l.title,
    updatedAt: l.updatedAt,
  }));
  storage.set(INDEX_KEY, index);
}

export function makeDefaultTiers() {
  return DEFAULT_TIERS.map((t) => ({
    id: Crypto.randomUUID(),
    label: t.label,
    color: t.color,
    itemIds: [] as string[],
  }));
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: {},
  hydrated: false,

  hydrate: async () => {
    const index = (await storage.get<IndexEntry[]>(INDEX_KEY)) ?? [];
    const lists: Record<string, TierList> = {};
    await Promise.all(
      index.map(async (entry) => {
        const list = await storage.get<TierList>(LIST_KEY(entry.id));
        if (list) lists[list.id] = list;
      })
    );
    set({ lists, hydrated: true });
  },

  createList: (title, category, items) => {
    const now = Date.now();
    const list: TierList = {
      id: Crypto.randomUUID(),
      title,
      category,
      createdAt: now,
      updatedAt: now,
      items: Object.fromEntries(items.map((i) => [i.id, i])),
      tiers: makeDefaultTiers(),
      unrankedIds: items.map((i) => i.id),
    };
    set((s) => ({ lists: { ...s.lists, [list.id]: list } }));
    persistList(list);
    persistIndex(get().lists);
    return list;
  },

  importList: (title, category, tiers) => {
    const now = Date.now();
    const allItems = tiers.flatMap((t) => t.items);
    const list: TierList = {
      id: Crypto.randomUUID(),
      title,
      category,
      createdAt: now,
      updatedAt: now,
      items: Object.fromEntries(allItems.map((i) => [i.id, i])),
      tiers: tiers.map((t) => ({
        id: Crypto.randomUUID(),
        label: t.label,
        color: t.color,
        itemIds: t.items.map((i) => i.id),
      })),
      unrankedIds: [],
    };
    set((s) => ({ lists: { ...s.lists, [list.id]: list } }));
    persistList(list);
    persistIndex(get().lists);
    return list;
  },

  importFromEncoded: (param) => {
    const draft = decodeParamToDraft(param);
    if (!draft) return null;
    return get().importList(draft.title, draft.category, draft.tiers);
  },

  upsertList: (list) => {
    const updated = { ...list, updatedAt: Date.now() };
    set((s) => ({ lists: { ...s.lists, [updated.id]: updated } }));
    persistList(updated);
    persistIndex(get().lists);
  },

  deleteList: (id) => {
    set((s) => {
      const { [id]: _removed, ...rest } = s.lists;
      return { lists: rest };
    });
    clearTimeout(saveTimers[id]);
    storage.remove(LIST_KEY(id));
    persistIndex(get().lists);
  },

  duplicateList: (id) => {
    const source = get().lists[id];
    if (!source) return null;
    const now = Date.now();
    const copy: TierList = {
      ...(JSON.parse(JSON.stringify(source)) as TierList),
      id: Crypto.randomUUID(),
      title: `${source.title} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ lists: { ...s.lists, [copy.id]: copy } }));
    persistList(copy);
    persistIndex(get().lists);
    return copy;
  },
}));
