import { fetchJson } from '@/data/http';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface ItunesArtist {
  artistId: number;
  artistName: string;
  primaryGenreName?: string;
}

interface ItunesAlbum {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  releaseDate?: string;
}

export const itunesMusicAdapter: CategoryAdapter = {
  category: 'music',
  label: 'Music',
  glyph: '🎧',
  accentColor: '#4CC9F0',
  blurb: 'Artists and albums, cover art included',
  isConfigured: () => true,

  async search(query, signal) {
    const q = encodeURIComponent(query);
    const [artists, albums] = await Promise.allSettled([
      fetchJson<{ results: ItunesArtist[] }>(
        `https://itunes.apple.com/search?term=${q}&entity=musicArtist&limit=8`,
        { signal }
      ),
      fetchJson<{ results: ItunesAlbum[] }>(
        `https://itunes.apple.com/search?term=${q}&entity=album&limit=16`,
        { signal }
      ),
    ]);

    const items: TierItem[] = [];

    if (artists.status === 'fulfilled') {
      for (const a of artists.value.results ?? []) {
        items.push({
          id: `music:artist-${a.artistId}`,
          name: a.artistName,
          imageUrl: null, // iTunes gives artists no artwork → initials tile
          subtitle: a.primaryGenreName ? `Artist · ${a.primaryGenreName}` : 'Artist',
          category: 'music',
        });
      }
    }

    if (albums.status === 'fulfilled') {
      for (const al of albums.value.results ?? []) {
        items.push({
          id: `music:album-${al.collectionId}`,
          name: al.collectionName,
          imageUrl: al.artworkUrl100 ? al.artworkUrl100.replace('100x100', '600x600') : null,
          subtitle: al.releaseDate
            ? `${al.artistName} · ${al.releaseDate.slice(0, 4)}`
            : al.artistName,
          category: 'music',
        });
      }
    }

    if (artists.status === 'rejected' && albums.status === 'rejected') {
      throw albums.reason;
    }

    return items;
  },
};
