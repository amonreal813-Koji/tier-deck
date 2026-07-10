/**
 * Tiny dependency-free fuzzy matcher. Ranks by how well a query matches text —
 * exact > prefix > substring > subsequence — so "zeld", "godfathr", or "piza"
 * all still find the right thing. Never requires an exact title.
 */

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 0 = no match; higher = better. */
export function fuzzyScore(query: string, text: string): number {
  const q = norm(query);
  const t = norm(text);
  if (!q || !t) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 850;

  // Any whole-word prefix match ("god" → "the godfather").
  for (const word of t.split(' ')) {
    if (word.startsWith(q)) return 780;
  }

  const idx = t.indexOf(q);
  if (idx >= 0) return 650 - Math.min(idx, 100);

  // Subsequence: every query char appears in order. Reward tight runs.
  let qi = 0;
  let streak = 0;
  let score = 0;
  let gaps = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi += 1;
      streak += 1;
      score += 2 + streak;
    } else if (streak > 0) {
      streak = 0;
      gaps += 1;
    }
  }
  if (qi === q.length) return Math.max(1, 200 + score - gaps * 4);
  return 0;
}

export interface Searchable {
  title: string;
  category?: string;
  tagline?: string;
  /** Names of items inside the list — lets "mario" find a games list. */
  itemNames?: string[];
}

/** Combined weighted score across a list's searchable fields. */
export function scoreSearchable(query: string, s: Searchable): number {
  if (!query.trim()) return 1;
  const title = fuzzyScore(query, s.title) * 3;
  const tag = s.tagline ? fuzzyScore(query, s.tagline) : 0;
  const cat = s.category ? fuzzyScore(query, s.category) * 1.5 : 0;
  let itemBest = 0;
  for (const name of s.itemNames ?? []) {
    itemBest = Math.max(itemBest, fuzzyScore(query, name));
  }
  return title + tag + cat + itemBest * 1.3;
}

/** Filter + rank a list of searchables by a query (stable when query empty). */
export function rankByQuery<T>(
  query: string,
  items: T[],
  toSearchable: (item: T) => Searchable
): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: scoreSearchable(query, toSearchable(item)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
