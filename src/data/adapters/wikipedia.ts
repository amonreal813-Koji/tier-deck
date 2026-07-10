import { fetchJson } from '@/data/http';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface WikiSearchResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid: number;
        title: string;
        index?: number;
        description?: string;
        thumbnail?: { source?: string };
      }
    >;
  };
}

/**
 * The universal adapter: anything with a Wikipedia article is rankable —
 * countries, animals, sneakers, philosophers, programming languages.
 * Items without a lead image still come through as initials tiles.
 */
export const wikipediaAdapter: CategoryAdapter = {
  category: 'anything',
  label: 'Everything',
  glyph: '🌐',
  accentColor: '#FFD23F',
  blurb: 'Anything with a Wikipedia page',
  isConfigured: () => true,

  async search(query, signal) {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=16` +
      `&prop=pageimages|description&pithumbsize=342&pilicense=any` +
      `&format=json&origin=*`;
    const json = await fetchJson<WikiSearchResponse>(url, { signal });
    const pages = Object.values(json.query?.pages ?? {});
    return pages
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map<TierItem>((p) => ({
        id: `anything:${p.pageid}`,
        name: p.title,
        imageUrl: p.thumbnail?.source ?? null,
        subtitle: p.description,
        category: 'anything',
      }));
  },
};
