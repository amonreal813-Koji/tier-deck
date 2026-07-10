import { fetchJson } from '@/data/http';
import { getKey } from '@/data/keys';
import { storage } from '@/store/storage';

import type { ArtSpec } from './types';

const memory = new Map<string, string | null>();

function cacheKey(art: Exclude<ArtSpec, null>): string {
  if (art.type === 'url') return `art:url:${art.url}`;
  if (art.type === 'itunes') return `art:itunes:${art.kind}:${art.term}`;
  if (art.type === 'wiki') return `art:wiki:${art.title}`;
  if (art.type === 'logo') return `art:logo:${art.domain}`;
  return `art:rawg:${art.term}`;
}

/** Brandfetch's CDN serves crisp brand logos by domain (Clearbit's free API
 *  was shut down). Returns the logo directly — no API round-trip needed. */
function logoUrl(domain: string): string {
  return `https://cdn.brandfetch.io/${domain}/w/400/h/400`;
}

async function fetchItunesArt(kind: 'tvShow' | 'album', term: string): Promise<string | null> {
  const entity = kind === 'tvShow' ? 'tvSeason' : 'album';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1&country=US`;
  const json = await fetchJson<{ results: { artworkUrl100?: string }[] }>(url, { timeoutMs: 8000 });
  const raw = json.results?.[0]?.artworkUrl100;
  return raw ? raw.replace('100x100', '600x600') : null;
}

interface WikiPagesResponse {
  query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
}

async function fetchWikiArt(title: string): Promise<string | null> {
  // pilicense=any is load-bearing: film posters are fair-use, and the
  // default (free-only) silently returns no thumbnail for them.
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=pageimages&pithumbsize=600&pilicense=any&format=json&origin=*&redirects=1`;
  const json = await fetchJson<WikiPagesResponse>(url, { timeoutMs: 8000 });
  const pages = json.query?.pages ?? {};
  for (const id in pages) {
    const thumb = pages[id]?.thumbnail?.source;
    if (thumb) return thumb;
  }
  return null;
}

async function fetchRawgArt(term: string): Promise<string | null> {
  const key = getKey('RAWG');
  if (!key) return null;
  const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(term)}&page_size=1`;
  const json = await fetchJson<{ results: { background_image: string | null }[] }>(url, { timeoutMs: 8000 });
  return json.results?.[0]?.background_image ?? null;
}

/**
 * Resolve artwork for a premade item: memory → disk cache → network.
 * Failures resolve to null (the UI falls back to an initials tile) and are
 * NOT cached, so a flaky request retries next open.
 */
export async function resolveArt(art: ArtSpec): Promise<string | null> {
  if (!art) return null;
  if (art.type === 'url') return art.url;
  if (art.type === 'logo') return logoUrl(art.domain);

  const key = cacheKey(art);
  if (memory.has(key)) return memory.get(key)!;

  const cached = await storage.get<string>(key);
  if (cached) {
    memory.set(key, cached);
    return cached;
  }

  try {
    const resolved =
      art.type === 'itunes'
        ? await fetchItunesArt(art.kind, art.term)
        : art.type === 'wiki'
          ? await fetchWikiArt(art.title)
          : await fetchRawgArt(art.term);
    if (resolved) {
      memory.set(key, resolved);
      storage.set(key, resolved);
    }
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Resolve a batch gently: small stagger keeps us friendly with iTunes'
 * ~20 req/min per-IP throttle on first-ever opens; cached items are instant.
 */
export async function resolveArtBatch(
  specs: { id: string; art: ArtSpec }[],
  onResolved: (id: string, url: string | null) => void
): Promise<void> {
  let delay = 0;
  await Promise.all(
    specs.map(async ({ id, art }) => {
      // Only network-bound lookups need the stagger.
      const needsNetwork = art != null && art.type !== 'url' && !memory.has(cacheKey(art));
      if (needsNetwork) {
        delay += 120;
        await new Promise((r) => setTimeout(r, delay));
      }
      const url = await resolveArt(art);
      onResolved(id, url);
    })
  );
}
