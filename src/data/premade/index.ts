import type { Category } from '@/data/types';

import catalogJson from './catalog.json';
import { cultureLists } from './culture';
import expansionsJson from './expansions.json';
import { foodLists } from './food';
import { gameLists } from './games';
import { movieLists } from './movies';
import { musicLists } from './music';
import type { ArtSpec, PremadeItem, PremadeList } from './types';

const TIER_COLOR: Record<string, string> = {
  S: '#FF3B6B',
  A: '#FF8A3D',
  B: '#FFD23F',
  C: '#4ADE80',
  D: '#38BDF8',
  F: '#A78BFA',
};

interface Expansion {
  listId: string;
  additions: { tierLabel: string; item: PremadeItem }[];
}

const catalog = catalogJson as unknown as PremadeList[];
const expansions = expansionsJson as unknown as Expansion[];

/** Hand-authored base lists (deep-cloned so expansion mutation is safe). */
const base: PremadeList[] = JSON.parse(
  JSON.stringify([...gameLists, ...movieLists, ...musicLists, ...foodLists, ...cultureLists])
);

// Fold each verified expansion's new items into the matching base list/tier.
const baseById = new Map(base.map((l) => [l.id, l]));
for (const exp of expansions) {
  const list = baseById.get(exp.listId);
  if (!list) continue;
  const existingIds = new Set(list.tiers.flatMap((t) => t.items.map((i) => i.id)));
  for (const add of exp.additions) {
    if (existingIds.has(add.item.id)) continue;
    let tier = list.tiers.find((t) => t.label === add.tierLabel);
    if (!tier) {
      tier = { label: add.tierLabel, color: TIER_COLOR[add.tierLabel] ?? '#94A3B8', items: [] };
      list.tiers.push(tier);
    }
    tier.items.push(add.item);
    existingIds.add(add.item.id);
  }
}

// Keep tiers in canonical order (S A B C D F, custom labels after). Expansions
// can append a tier that didn't exist yet (e.g. a 'D' onto an S-A-B-C-F list),
// which would otherwise render out of order.
const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'F'];
const tierRank = (label: string) => {
  const i = TIER_ORDER.indexOf(label);
  return i === -1 ? TIER_ORDER.length : i;
};
for (const list of [...base, ...catalog]) {
  list.tiers.sort((a, b) => tierRank(a.label) - tierRank(b.label));
}

const CATEGORY_ORDER: Category[] = ['games', 'movies', 'music', 'food', 'anything', 'books'];

/** Featured order: grouped by category for a browsable "All" view. */
export const premadeLists: PremadeList[] = [...base, ...catalog].sort(
  (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
);

export function getPremadeList(id: string): PremadeList | undefined {
  return premadeLists.find((l) => l.id === id);
}

/** The image for a list's card: explicit heroArt, else the top item's art. */
export function heroArtFor(list: PremadeList): ArtSpec {
  return list.heroArt ?? list.tiers[0]?.items[0]?.art ?? null;
}

/** Flattened item names for fuzzy search ("zelda" → the games list). */
export function itemNamesOf(list: PremadeList): string[] {
  return list.tiers.flatMap((t) => t.items.map((i) => i.name));
}
