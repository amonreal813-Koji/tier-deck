import { fetchJson } from '@/data/http';
import { getKey } from '@/data/keys';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  rating: number;
}

export const rawgAdapter: CategoryAdapter = {
  category: 'games',
  label: 'Video Games',
  glyph: '🎮',
  accentColor: '#7C5CFF',
  blurb: '500,000+ games with box art',
  isConfigured: () => !!getKey('RAWG'),
  configHint: 'Grab a free key at rawg.io/apidocs, then add EXPO_PUBLIC_RAWG_KEY to .env and restart the dev server.',

  async search(query, signal) {
    const key = getKey('RAWG');
    const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(query)}&page_size=20`;
    const json = await fetchJson<{ results: RawgGame[] }>(url, { signal });
    return (json.results ?? [])
      .filter((g) => g.background_image)
      .map<TierItem>((g) => ({
        id: `games:${g.id}`,
        name: g.name,
        imageUrl: g.background_image,
        subtitle: g.released ? g.released.slice(0, 4) : undefined,
        category: 'games',
        metadata: { rating: g.rating, released: g.released ?? '' },
      }));
  },
};
