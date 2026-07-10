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

interface WikiSearchResponse {
  query?: {
    pages?: Record<
      string,
      { pageid: number; title: string; index?: number; thumbnail?: { source?: string } }
    >;
  };
}

/** Rich box art when a RAWG key is present. */
async function searchRawg(query: string, signal: AbortSignal, key: string): Promise<TierItem[]> {
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
}

/**
 * Key-free fallback: games via Wikipedia search + page images. Appending
 * "video game" keeps results on-topic; pages without a lead image are dropped.
 * Mirrors the movies adapter's Wikipedia fallback so games need zero setup.
 */
async function searchWikiGames(query: string, signal: AbortSignal): Promise<TierItem[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(`${query} video game`)}&gsrlimit=12` +
    `&prop=pageimages&pithumbsize=342&pilicense=any&format=json&origin=*`;
  const json = await fetchJson<WikiSearchResponse>(url, { signal });
  const pages = Object.values(json.query?.pages ?? {});
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((p) => p.thumbnail?.source)
    .map<TierItem>((p) => ({
      id: `games:wiki-${p.pageid}`,
      name: p.title.replace(/ \([^)]*(?:video game|game)[^)]*\)$/i, ''),
      imageUrl: p.thumbnail!.source!,
      subtitle: 'Game',
      category: 'games',
    }));
}

export const rawgAdapter: CategoryAdapter = {
  category: 'games',
  label: 'Video Games',
  glyph: '🎮',
  accentColor: '#7C5CFF',
  blurb: 'Search any game — box art included',
  // Works key-free via Wikipedia; a RAWG key just makes results richer.
  isConfigured: () => true,
  configHint: 'Optional: add EXPO_PUBLIC_RAWG_KEY from rawg.io/apidocs for richer results.',

  async search(query, signal) {
    const key = getKey('RAWG');
    if (key) return searchRawg(query, signal, key);
    return searchWikiGames(query, signal);
  },
};
