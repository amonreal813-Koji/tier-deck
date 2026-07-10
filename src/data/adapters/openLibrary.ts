import { fetchJson } from '@/data/http';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

export const openLibraryAdapter: CategoryAdapter = {
  category: 'books',
  label: 'Books',
  glyph: '📚',
  accentColor: '#34D399',
  blurb: 'Every book with a cover, ever',
  isConfigured: () => true,

  async search(query, signal) {
    const url =
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}` +
      `&limit=20&fields=key,title,author_name,first_publish_year,cover_i`;
    const json = await fetchJson<{ docs: OpenLibraryDoc[] }>(url, { signal });
    return (json.docs ?? [])
      .filter((d) => d.cover_i)
      .map<TierItem>((d) => ({
        id: `books:${d.key.replace('/works/', '')}`,
        name: d.title,
        imageUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`,
        subtitle: [d.author_name?.[0], d.first_publish_year].filter(Boolean).join(' · ') || undefined,
        category: 'books',
      }));
  },
};
