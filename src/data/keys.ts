/**
 * API keys come from .env as EXPO_PUBLIC_* vars (inlined at build time).
 * Fine for a local-only v1; revisit before store distribution.
 */
const KEYS = {
  RAWG: process.env.EXPO_PUBLIC_RAWG_KEY,
  TMDB: process.env.EXPO_PUBLIC_TMDB_KEY,
} as const;

export type KeyName = keyof typeof KEYS;

export function getKey(name: KeyName): string | undefined {
  const value = KEYS[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}
