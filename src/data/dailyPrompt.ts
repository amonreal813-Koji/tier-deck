import { premadeLists } from '@/data/premade';
import { storage } from '@/store/storage';

/**
 * The Daily Prompt: one curated list per day that everyone ranks, so the
 * community converges on the same subject and the consensus actually means
 * something.
 *
 * Deliberately backend-free: the pick is a pure function of the UTC date, so
 * every device shows the same prompt on the same day with no server round-trip
 * and no way to drift out of sync.
 */

/** Lists that make good prompts: enough items to be interesting, not a slog. */
const POOL = premadeLists.filter((l) => {
  const count = l.tiers.reduce((n, t) => n + t.items.length, 0);
  return count >= 8 && count <= 22;
});

/** FNV-1a — small, stable, and dependency-free. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Hash-ordered so consecutive days aren't neighbours in the catalog (otherwise
// you'd get "NBA Teams" then "NBA Players" two days running).
const ORDER = POOL.map((l) => l.id).sort((a, b) => hash(a) - hash(b));

/** Days since the epoch, in UTC — the same integer worldwide on a given date. */
export function dayNumber(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000);
}

/** The prompt (curated list id) for a given day. */
export function dailyPromptId(d: Date = new Date()): string | undefined {
  if (ORDER.length === 0) return undefined;
  return ORDER[dayNumber(d) % ORDER.length];
}

/* ---------------- streak ---------------- */

const STREAK_KEY = 'daily:streak:v1';

interface StreakState {
  /** dayNumber of the last day the daily prompt was ranked. */
  lastDay: number;
  count: number;
}

/** Current streak — 0 once a day has been missed. */
export async function getStreak(): Promise<number> {
  const s = await storage.get<StreakState>(STREAK_KEY);
  if (!s) return 0;
  const today = dayNumber();
  // Still counts while today isn't over yet, hence today-1 is also "alive".
  return s.lastDay === today || s.lastDay === today - 1 ? s.count : 0;
}

/** Record that today's prompt was ranked; returns the new streak. */
export async function markDailyRanked(): Promise<number> {
  const today = dayNumber();
  const s = await storage.get<StreakState>(STREAK_KEY);
  let count: number;
  if (s?.lastDay === today) count = s.count; // already counted today
  else if (s?.lastDay === today - 1) count = s.count + 1;
  else count = 1;
  await storage.set(STREAK_KEY, { lastDay: today, count });
  return count;
}

/** Has today's prompt already been ranked on this device? */
export async function rankedToday(): Promise<boolean> {
  const s = await storage.get<StreakState>(STREAK_KEY);
  return s?.lastDay === dayNumber();
}
