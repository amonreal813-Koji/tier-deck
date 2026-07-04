export type Category = 'games' | 'movies' | 'food' | 'music';

export interface TierItem {
  /** `${category}:${sourceId}` — globally unique, dedupe-safe across categories. */
  id: string;
  name: string;
  /** null → render an initials tile with the category gradient. */
  imageUrl: string | null;
  /** e.g. "2017 · Nintendo" / "Film · 2019" / "Dessert" / "Album · 2020" */
  subtitle?: string;
  category: Category;
  metadata?: Record<string, string | number>;
}

export interface Tier {
  id: string;
  /** User-renamable: "S", "A", "Goated", ... */
  label: string;
  /** Hex from the tier palette — drives the glow. */
  color: string;
  /** Ordering lives here; item payloads never move. */
  itemIds: string[];
}

export interface TierList {
  id: string;
  title: string;
  category: Category;
  createdAt: number;
  updatedAt: number;
  /** Normalized: the single source of truth for item data. */
  items: Record<string, TierItem>;
  /** Board order = array order. */
  tiers: Tier[];
  /** The staging pool at the bottom of the board. */
  unrankedIds: string[];
}
