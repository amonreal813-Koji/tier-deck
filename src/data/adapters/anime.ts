import { fetchJson } from '@/data/http';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface KitsuAnime {
  id: string;
  attributes: {
    canonicalTitle: string;
    startDate: string | null;
    subtype: string | null;
    posterImage: { medium?: string; small?: string; original?: string } | null;
  };
}

/**
 * Anime via Kitsu (key-free, CORS-friendly, reliable poster art). Chosen over
 * Jikan/MyAnimeList, which is heavily rate-limited and prone to 504s.
 */
export const animeAdapter: CategoryAdapter = {
  category: 'anime',
  label: 'Anime',
  glyph: '🌸',
  accentColor: '#F472B6',
  blurb: 'Every series, with poster art',
  isConfigured: () => true,

  async search(query, signal) {
    const url =
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}` +
      `&page[limit]=20&fields[anime]=canonicalTitle,startDate,posterImage,subtype`;
    const json = await fetchJson<{ data: KitsuAnime[] }>(url, { signal });
    return (json.data ?? [])
      .filter((d) => d.attributes.posterImage?.medium || d.attributes.posterImage?.small)
      .map<TierItem>((d) => {
        const a = d.attributes;
        const year = a.startDate ? a.startDate.slice(0, 4) : undefined;
        const kind = a.subtype ? a.subtype.replace('TV', 'Series') : 'Anime';
        return {
          id: `anime:${d.id}`,
          name: a.canonicalTitle,
          imageUrl: a.posterImage!.medium ?? a.posterImage!.small ?? null,
          subtitle: [kind, year].filter(Boolean).join(' · ') || undefined,
          category: 'anime',
        };
      });
  },
};
