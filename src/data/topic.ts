import type { TierItem } from '@/data/types';

/**
 * Topic explorer — turn "search a game, then rank its characters" into a few
 * Wikipedia calls that work for *anything*: games, shows, franchises, bands.
 *
 * No API key: Wikipedia's action API is CORS-open with origin=*. We resolve a
 * subject, then pull a "collection" (characters / episodes / songs / …) from
 * the matching Wikipedia category, with images.
 */

const API = 'https://en.wikipedia.org/w/api.php';

export interface Subject {
  title: string;
  description?: string;
  imageUrl?: string | null;
}

/** A pull-able collection kind and the category noun Wikipedia uses for it. */
export interface Facet {
  key: string;
  label: string;
  glyph: string;
  /** Category-noun candidates, tried in order (e.g. "characters"). */
  nouns: string[];
}

/** A broad, general set — not all apply to every subject; empty ones hide. */
export const FACETS: Facet[] = [
  { key: 'characters', label: 'Characters', glyph: '🧑‍🤝‍🧑', nouns: ['characters'] },
  { key: 'episodes', label: 'Episodes', glyph: '📺', nouns: ['episodes'] },
  { key: 'seasons', label: 'Seasons', glyph: '🗓️', nouns: ['seasons'] },
  { key: 'films', label: 'Films', glyph: '🎬', nouns: ['films', 'films in the series'] },
  { key: 'songs', label: 'Songs', glyph: '🎵', nouns: ['songs'] },
  { key: 'albums', label: 'Albums', glyph: '💿', nouns: ['albums'] },
  { key: 'locations', label: 'Locations', glyph: '🗺️', nouns: ['locations'] },
  { key: 'weapons', label: 'Weapons', glyph: '⚔️', nouns: ['weapons'] },
  { key: 'creatures', label: 'Creatures', glyph: '🐉', nouns: ['creatures', 'monsters', 'species'] },
];

async function getJson<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const qs = new URLSearchParams({ format: 'json', origin: '*', ...params }).toString();
  const res = await fetch(`${API}?${qs}`, { signal });
  return (await res.json()) as T;
}

/** Autocomplete subjects as the user types (title + thumbnail + blurb). */
export async function searchSubjects(query: string, signal?: AbortSignal): Promise<Subject[]> {
  if (query.trim().length < 2) return [];
  const json = await getJson<{
    query?: { pages?: Record<string, { index?: number; title: string; description?: string; thumbnail?: { source?: string } }> };
  }>(
    {
      action: 'query',
      generator: 'prefixsearch',
      gpssearch: query.trim(),
      gpslimit: '8',
      prop: 'pageimages|description',
      piprop: 'thumbnail',
      pithumbsize: '200',
      redirects: '1',
    },
    signal
  );
  const pages = Object.values(json.query?.pages ?? {});
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => ({ title: p.title, description: p.description, imageUrl: p.thumbnail?.source ?? null }));
}

async function categoryMembers(catTitle: string, signal?: AbortSignal): Promise<string[]> {
  const json = await getJson<{ query?: { categorymembers?: { title: string }[] } }>(
    {
      action: 'query',
      list: 'categorymembers',
      cmtitle: catTitle.startsWith('Category:') ? catTitle : `Category:${catTitle}`,
      cmlimit: '60',
      cmtype: 'page',
    },
    signal
  );
  return (json.query?.categorymembers ?? []).map((m) => m.title);
}

/**
 * Find the best-matching Wikipedia category for "<subject> <noun>", handling
 * disambiguation (e.g. subject "The Office" → "Category:The Office (American TV
 * series) characters"). Searches the Category namespace and ranks by overlap.
 */
async function findCategoryCandidates(subject: string, noun: string, signal?: AbortSignal): Promise<string[]> {
  const json = await getJson<{ query?: { search?: { title: string }[] } }>(
    { action: 'query', list: 'search', srsearch: `${subject} ${noun}`, srnamespace: '14', srlimit: '8' },
    signal
  );
  const results = (json.query?.search ?? []).map((r) => r.title); // "Category:…"
  const words = subject.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !['the', 'and'].includes(w));
  return results
    .filter((t) => new RegExp(`\\b${noun}\\b`, 'i').test(t))
    .map((t) => {
      const low = t.toLowerCase();
      const score = words.reduce((n, w) => n + (low.includes(w) ? 1 : 0), 0);
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}

async function withImages(
  titles: string[],
  signal?: AbortSignal
): Promise<{ title: string; imageUrl: string | null; description?: string }[]> {
  const out: { title: string; imageUrl: string | null; description?: string }[] = [];
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const json = await getJson<{
      query?: { pages?: Record<string, { title: string; description?: string; thumbnail?: { source?: string } }> };
    }>(
      {
        action: 'query',
        titles: batch.join('|'),
        prop: 'pageimages|description',
        piprop: 'thumbnail',
        pithumbsize: '400',
        pilicense: 'any', // include infobox posters/covers (films, TV, etc.)
        redirects: '1',
      },
      signal
    );
    for (const p of Object.values(json.query?.pages ?? {})) {
      out.push({ title: p.title, imageUrl: p.thumbnail?.source ?? null, description: p.description });
    }
  }
  return out;
}

/**
 * Fallback for topics with no category: pull the linked entities from a
 * "List of <subject> <noun>" article (many games/shows have one even when they
 * lack a category). Noisy, so callers still filter + image-check.
 */
async function listArticleLinks(subject: string, noun: string, signal?: AbortSignal): Promise<string[]> {
  const titles = [`List of ${subject} ${noun}`, `${subject} ${noun}`];
  for (const title of titles) {
    const json = await getJson<{
      query?: { pages?: Record<string, { missing?: string; links?: { title: string }[] }> };
    }>(
      { action: 'query', titles: title, prop: 'links', pllimit: '150', plnamespace: '0', redirects: '1' },
      signal
    ).catch(() => null);
    const page = json?.query?.pages && Object.values(json.query.pages)[0];
    if (page && !('missing' in page) && page.links?.length) {
      return page.links.map((l) => l.title);
    }
  }
  return [];
}

/** Tidy an article title into a display name for a given subject. */
function cleanName(title: string, subject: string): string {
  return title
    .replace(/\s*\([^)]*\)\s*$/, '') // drop trailing "(disambiguation)"
    .replace(new RegExp(`\\s*\\(${subject}[^)]*\\)`, 'i'), '')
    .trim();
}

const SKIP = /^(List of|Category:|Template:|Outline of|Index of|Glossary)/i;

/**
 * Facets whose art is a cover — fetched from iTunes (reliable for music).
 * Films are NOT here: iTunes' movie search is empty, but Wikipedia's infobox
 * poster comes through via pilicense=any in withImages().
 */
const MEDIA_ENTITY: Record<string, 'album' | 'song'> = {
  albums: 'album',
  songs: 'song',
};

/** iTunes cover/poster for a title (upscaled), or null. */
async function itunesArt(term: string, entity: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const u = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1&country=US`;
    const res = await fetch(u, { signal });
    const json = (await res.json()) as { results?: { artworkUrl100?: string }[] };
    const art = json.results?.[0]?.artworkUrl100;
    return art ? art.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1') : null;
  } catch {
    return null;
  }
}

/** Fill in poster/cover art from iTunes for media items (batched, art wins). */
async function enrichWithItunes(items: TierItem[], entity: string, signal?: AbortSignal): Promise<TierItem[]> {
  const out = [...items];
  for (let i = 0; i < out.length; i += 6) {
    const slice = out.slice(i, i + 6);
    await Promise.all(
      slice.map(async (it, k) => {
        const art = await itunesArt(it.name, entity, signal);
        if (art) out[i + k] = { ...it, imageUrl: art };
      })
    );
  }
  return out;
}

/**
 * Pull a collection (e.g. characters) for a subject. Tries the subject's
 * Wikipedia category first (individual entities with art); returns [] if the
 * subject simply has no such category, so the UI can hide that facet.
 */
export async function fetchCollection(
  subject: string,
  facet: Facet,
  signal?: AbortSignal
): Promise<TierItem[]> {
  const bare = cleanName(subject, subject);
  const candidates: string[] = [];
  for (const noun of facet.nouns) {
    candidates.push(`${subject} ${noun}`);
    if (bare !== subject) candidates.push(`${bare} ${noun}`);
  }

  let members: string[] = [];
  for (const cat of candidates) {
    try {
      members = await categoryMembers(cat, signal);
    } catch {
      members = [];
    }
    if (members.length) break;
  }
  // Disambiguation fallback: search the Category namespace, then pick whichever
  // candidate category actually has the most entities (beats a near-empty
  // generic category like "The Office characters").
  const realCount = (ms: string[]) => ms.filter((t) => !SKIP.test(t)).length;
  if (realCount(members) < 3) {
    for (const noun of facet.nouns) {
      const cats = await findCategoryCandidates(bare, noun, signal).catch(() => []);
      for (const cat of cats.slice(0, 4)) {
        const ms = await categoryMembers(cat, signal).catch(() => []);
        if (realCount(ms) > realCount(members)) members = ms;
        if (realCount(members) >= 8) break;
      }
      if (realCount(members) >= 3) break;
    }
  }
  members = members.filter((t) => !SKIP.test(t));

  // Last-resort: harvest a "List of …" article's links, keep only those with a
  // real image (filters out the article's navigation/see-also noise).
  let imageOnly = false;
  if (members.length < 3) {
    for (const noun of facet.nouns) {
      const links = await listArticleLinks(bare, noun, signal).catch(() => []);
      if (links.length) {
        members = links.filter((t) => !SKIP.test(t)).slice(0, 80);
        imageOnly = true; // link lists are noisy — trust only entities with art
        break;
      }
    }
  }
  if (!members.length) return [];

  const enriched = await withImages(members.slice(0, 60), signal);
  const usable = enriched.filter((e) => !SKIP.test(e.title) && (!imageOnly || e.imageUrl));
  // Image-bearing entities first; keeps the grid looking full and real.
  usable.sort((a, b) => (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0));
  let items: TierItem[] = usable.slice(0, 50).map((e) => ({
    id: `wiki-${e.title}`,
    name: cleanName(e.title, bare),
    imageUrl: e.imageUrl,
    subtitle: e.description,
    category: 'anything' as const,
  }));

  // Films / albums / songs: pull real posters & covers from iTunes.
  const entity = MEDIA_ENTITY[facet.key];
  if (entity) {
    items = await enrichWithItunes(items, entity, signal);
    items.sort((a, b) => (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0));
  }
  return items;
}
