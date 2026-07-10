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

interface TvMazeResult {
  show: {
    id: number;
    name: string;
    premiered: string | null;
    image: { medium: string; original: string } | null;
  };
}

interface WikiSearchResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid: number;
        title: string;
        index?: number;
        thumbnail?: { source?: string };
      }
    >;
  };
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

/** TV shows via TVMaze — key-free, CORS-open, solid poster art. */
async function searchTvMaze(query: string, signal: AbortSignal): Promise<TierItem[]> {
  const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
  const json = await fetchJson<TvMazeResult[]>(url, { signal });
  return (json ?? [])
    .filter((r) => r.show.image)
    .slice(0, 10)
    .map<TierItem>((r) => ({
      id: `movies:tvmaze-${r.show.id}`,
      name: r.show.name,
      imageUrl: r.show.image!.medium.replace('http://', 'https://'),
      subtitle: r.show.premiered ? `TV · ${r.show.premiered.slice(0, 4)}` : 'TV',
      category: 'movies',
    }));
}

/**
 * Films via Wikipedia search + page images — key-free. Appending "film" to
 * the search keeps results on-topic; pages without a lead image are dropped.
 * (iTunes movie search is dead — returns zero results as of 2026.)
 */
async function searchWikiFilms(query: string, signal: AbortSignal): Promise<TierItem[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(`${query} film`)}&gsrlimit=10` +
    `&prop=pageimages&pithumbsize=342&pilicense=any&format=json&origin=*`;
  const json = await fetchJson<WikiSearchResponse>(url, { signal });
  const pages = Object.values(json.query?.pages ?? {});
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((p) => p.thumbnail?.source)
    .map<TierItem>((p) => ({
      id: `movies:wiki-${p.pageid}`,
      name: p.title.replace(/ \([^)]*film[^)]*\)$/i, ''),
      imageUrl: p.thumbnail!.source!,
      subtitle: 'Film',
      category: 'movies',
    }));
}

export const tmdbAdapter: CategoryAdapter = {
  category: 'movies',
  label: 'Movies & TV',
  glyph: '🎬',
  accentColor: '#FF6B9D',
  blurb: 'Every film and show ever made',
  // Works key-free via TVMaze + Wikipedia; a TMDB key just makes it richer.
  isConfigured: () => true,
  configHint: 'Optional: add EXPO_PUBLIC_TMDB_KEY from themoviedb.org for richer results.',

  async search(query, signal) {
    const key = getKey('TMDB');
    if (key) return searchTmdb(query, signal, key);

    const [tv, films] = await Promise.allSettled([
      searchTvMaze(query, signal),
      searchWikiFilms(query, signal),
    ]);
    const items: TierItem[] = [];
    if (films.status === 'fulfilled') items.push(...films.value);
    if (tv.status === 'fulfilled') items.push(...tv.value);
    if (tv.status === 'rejected' && films.status === 'rejected') {
      throw films.reason;
    }
    return items;
  },
};
