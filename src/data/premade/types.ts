import type { Category } from '@/data/types';

/** How to find artwork for a premade item. */
export type ArtSpec =
  /** A direct, stable image URL (ingredient PNGs, brand logos). */
  | { type: 'url'; url: string }
  /** Resolved lazily via the key-free iTunes Search API, then cached.
   *  NOTE: iTunes movie search is dead (returns 0 results) — use 'wiki'
   *  for films; 'tvShow' and 'album' still work. */
  | { type: 'itunes'; kind: 'tvShow' | 'album'; term: string }
  /** Lead image of an exact Wikipedia article (great for film posters). */
  | { type: 'wiki'; title: string }
  /** Official brand logo via Clearbit, by primary domain (e.g. "nike.com"). */
  | { type: 'logo'; domain: string }
  /** Resolved via RAWG when a key is configured, else initials tile. */
  | { type: 'rawg'; term: string }
  | null;

export interface PremadeItem {
  /** Stable id within the list, kebab-case. */
  id: string;
  name: string;
  subtitle?: string;
  art: ArtSpec;
  /** Why it sits in this tier — grounded in broad consensus, not hot takes. */
  reasoning: string;
}

export interface PremadeTier {
  label: string;
  color: string;
  items: PremadeItem[];
}

export interface PremadeList {
  id: string;
  title: string;
  category: Category;
  /** One-line hook shown on the featured card. */
  tagline: string;
  /** Where the placements come from — the credibility line. */
  basis: string;
  /**
   * Image for the card background. Defaults to the top item's art when omitted;
   * set explicitly when the top item's art is a logo or off-theme.
   */
  heroArt?: ArtSpec;
  tiers: PremadeTier[];
}
