import { storage } from '@/store/storage';

/**
 * Friend challenges: "I ranked this — can you match me?"
 *
 * The challenger's whole ranking rides inside the link (base64url), so a
 * challenge costs nothing server-side and works even for someone who has never
 * opened the app before. Scores are the same 1..6 tier scale used by prompts.
 */

export interface Challenge {
  /** Prompt (curated list) id. */
  promptId: string;
  /** Challenger's display name. */
  name: string;
  /** itemId -> score (6 = top tier … 1 = bottom). */
  scores: Record<string, number>;
}

interface Wire {
  v: 1;
  p: string;
  n: string;
  s: Record<string, number>;
}

function toBase64Url(json: string): string {
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(param: string): string {
  const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))));
}

export function encodeChallenge(c: Challenge): string {
  const wire: Wire = { v: 1, p: c.promptId, n: c.name, s: c.scores };
  return toBase64Url(JSON.stringify(wire));
}

export function decodeChallenge(param: string): Challenge | null {
  try {
    const w = JSON.parse(fromBase64Url(param)) as Wire;
    if (!w || w.v !== 1 || !w.p || typeof w.s !== 'object') return null;
    return { promptId: String(w.p), name: String(w.n || 'A friend'), scores: w.s };
  } catch {
    return null;
  }
}

/**
 * Absolute link to a challenge. The production export is served under /app
 * while the dev server serves the same routes at the root, so derive the base
 * from the current path instead of hardcoding either.
 */
export function buildChallengeUrl(c: Challenge): string {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://tier-deck.netlify.app';
  const underApp =
    typeof window !== 'undefined' && window.location ? window.location.pathname.startsWith('/app') : true;
  return `${origin}${underApp ? '/app' : ''}/community/challenge?d=${encodeChallenge(c)}`;
}

/**
 * Agreement between two rankings, over the items both people placed.
 * Scores are 1..6, so the worst possible gap is 5 — average the gaps and invert
 * to a friendly percentage (identical rankings = 100%).
 */
export function agreement(
  mine: Record<string, number>,
  theirs: Record<string, number>
): { pct: number; shared: number; diffs: { itemId: string; mine: number; theirs: number; gap: number }[] } {
  const ids = Object.keys(mine).filter((id) => theirs[id] !== undefined);
  if (ids.length === 0) return { pct: 0, shared: 0, diffs: [] };
  const diffs = ids
    .map((itemId) => ({
      itemId,
      mine: mine[itemId],
      theirs: theirs[itemId],
      gap: Math.abs(mine[itemId] - theirs[itemId]),
    }))
    .sort((a, b) => b.gap - a.gap);
  const avgGap = diffs.reduce((n, d) => n + d.gap, 0) / ids.length;
  return { pct: Math.round((1 - avgGap / 5) * 100), shared: ids.length, diffs };
}

/* ---------------- pending challenge (survives the ranking detour) ---------------- */

const PENDING_KEY = 'challenge:pending:v1';

/** Remember an incoming challenge so the compare can run after they rank. */
export async function savePendingChallenge(c: Challenge): Promise<void> {
  await storage.set(PENDING_KEY, c);
}

/** The pending challenge for a prompt, if any. */
export async function getPendingChallenge(promptId: string): Promise<Challenge | null> {
  const c = await storage.get<Challenge>(PENDING_KEY);
  return c && c.promptId === promptId ? c : null;
}

export async function clearPendingChallenge(): Promise<void> {
  await storage.remove(PENDING_KEY);
}
