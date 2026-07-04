import type { Category, TierItem } from '@/data/types';

/**
 * A category IS an adapter. Adding a new rankable universe (books, sneakers,
 * countries...) means writing one of these and adding a registry line —
 * the picker and search screens are fully adapter-agnostic.
 */
export interface CategoryAdapter {
  category: Category;
  /** "Video Games" */
  label: string;
  /** Emoji glyph for the picker card. */
  glyph: string;
  /** Category tint used across picker/search chrome. */
  accentColor: string;
  /** One-liner shown on the picker card. */
  blurb: string;
  /** false → picker card renders the "needs setup" state. */
  isConfigured: () => boolean;
  /** Shown when unconfigured: where to get a key. */
  configHint?: string;
  search: (query: string, signal: AbortSignal) => Promise<TierItem[]>;
}
