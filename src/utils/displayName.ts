/**
 * Client-side display-name validation. The DB unique index is the real guard
 * against duplicates; this gives fast, friendly feedback before we hit it.
 */

export const NAME_MIN = 2;
export const NAME_MAX = 24;

// Substrings that make a name inappropriate. Kept deliberately small and
// obvious — this is a first-pass filter, not a complete moderation system.
// Matched against the name with separators stripped so "f_u_c_k" is caught.
const BLOCKED = [
  'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'rape', 'nazi', 'kike', 'spic', 'chink', 'whore', 'slut',
  'pedo', 'cum', 'dick', 'cock', 'pussy', 'anal', 'porn', 'semen',
];

/** Returns an error message, or null if the name is acceptable. */
export function validateDisplayName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < NAME_MIN) return `At least ${NAME_MIN} characters.`;
  if (name.length > NAME_MAX) return `At most ${NAME_MAX} characters.`;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) {
    return 'Letters, numbers, spaces, and . _ - only.';
  }
  const collapsed = name.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKED.some((word) => collapsed.includes(word))) {
    return 'Please choose a different name.';
  }
  return null;
}
