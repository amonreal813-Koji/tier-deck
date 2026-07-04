import { fetchJson } from '@/data/http';
import { getKey } from '@/data/keys';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface TmdbResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface ItunesMovie {
  trackId: number;
  trackName: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
}

async function searchTmdb(query: string, signal: AbortSignal, key: string): Promise<TierItem[]> {
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&include_adult=false`;
  const json = await fetchJson<{ results: TmdbResult[] }>(url, { signal });
  return (json.results ?? [])
    .filter((r) => r.media_type !== 'person' && r.poster_path)
    .map<TierItem>((r) => {
      const year = (r.release_date ?? r.first_air_date ?? '').slice(0, 4);
      const kind = r.media_type === 'tv' ? 'TV' : 'Film';
      return {
        id: `movies:${r.media_type}-${r.id}`,
        name: r.title ?? r.name ?? 'Untitled',
        imageUrl: `https://image.tmdb.org/t/p/w342${r.poster_path}`,
        subtitle: year ? `${kind} · ${year}` : kind,
        category: 'movies',
        metadata: { rating: r.vote_average ?? 0 },
      };
    });
}

/** Key-free fallback so the category works out of the box. */
async function searchItunesMovies(query: string, signal: AbortSignal): Promise<TierItem[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=movie&limit=20`;
  const json = await fetchJson<{ results: ItunesMovie[] }>(url, { signal });
  return (json.results ?? [])
    .filter((m) => m.artworkUrl100)
    .map<TierItem>((m) => ({
      id: `movies:itunes-${m.trackId}`,
      name: m.trackName,
      imageUrl: m.artworkUrl100!.replace('100x100', '600x600'),
      subtitle: m.releaseDate ? `Film · ${m.releaseDate.slice(0, 4)}` : 'Film',
      category: 'movies',
      metadata: { genre: m.primaryGenreName ?? '' },
    }));
}

export const tmdbAdapter: CategoryAdapter = {
  category: 'movies',
  label: 'Movies & TV',
  glyph: '🎬',
  accentColor: '#FF6B9D',
  blurb: 'Every film and show ever made',
  // Works key-free via the iTunes fallback; a TMDB key just makes it richer.
  isConfigured: () => true,
  configHint: 'Optional: add EXPO_PUBLIC_TMDB_KEY from themoviedb.org for full TV coverage.',

  async search(query, signal) {
    const key = getKey('TMDB');
    if (key) return searchTmdb(query, signal, key);
    return searchItunesMovies(query, signal);
  },
};
