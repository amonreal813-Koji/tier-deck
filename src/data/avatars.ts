/**
 * Curated avatar choices for community profiles.
 *
 * Two kinds, both stored in profiles.avatar_url as a plain string:
 *  - `emoji:🎮` tokens — rendered as a colored tile by <Avatar>. Always work,
 *    no broken images, no licensing worries.
 *  - real square image URLs pulled from our own catalog art (iTunes covers,
 *    which crop cleanly to a circle) — the "from our lists" ask.
 * A signed-in user's Google photo is offered too (added dynamically).
 */

export const AVATAR_EMOJIS = [
  '🎮', '🎬', '🍕', '🎧', '🏆', '🌸', '👑', '🔥',
  '⭐', '💀', '🐉', '👾', '🦖', '🍔', '⚔️', '🎸',
].map((e) => `emoji:${e}`);

/** Square cover art from our curated lists — safe to crop to a circle. */
export const AVATAR_IMAGES = [
  'https://is1-ssl.mzstatic.com/image/thumb/Video/v4/a4/e7/7a/a4e77a2b-02e1-726f-2415-38a2b127114b/mzl.gytnpzxi.lsr/600x600bb.jpg', // SpongeBob
  'https://is1-ssl.mzstatic.com/image/thumb/Video112/v4/83/c6/4d/83c64d83-c515-fab3-fc84-1528ed401118/pr_source.lsr/600x600bb.jpg', // Rick and Morty
  'https://is1-ssl.mzstatic.com/image/thumb/Video3/v4/7b/99/f7/7b99f7b5-ee66-422e-2c16-3625525f11b9/mzl.fbwmkpdg.lsr/600x600bb.jpg', // Breaking Bad
  'https://is1-ssl.mzstatic.com/image/thumb/Video1/v4/6f/62/80/6f62804d-4e16-5948-cbf9-52174b700f45/mzl.kixbbnqo.lsr/600x600bb.jpg', // Family Guy
  'https://is1-ssl.mzstatic.com/image/thumb/Video/v4/aa/95/45/aa95453a-01a6-e159-9b89-d9392e94a79d/mzl.rmcbjpdp.lsr/600x600bb.jpg', // Looney Tunes
  'https://is1-ssl.mzstatic.com/image/thumb/Video128/v4/cd/e9/9d/cde99d66-debe-666b-3a4d-18c77c924484/mzl.qwaiuuuo.lsr/600x600bb.jpg', // Teen Titans Go!
  'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/36/86/ec/3686ec99-dec4-0a01-8b74-2d8a9a0263a7/12UMGIM52988.rgb.jpg/600x600bb.jpg', // Kendrick — good kid
  'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/8c/20/1f/8c201f03-7617-2d8b-3d8d-e0ba2d55041b/196872123784.jpg/600x600bb.jpg', // Wu-Tang — 36 Chambers
];

export const AVATAR_OPTIONS = [...AVATAR_EMOJIS, ...AVATAR_IMAGES];

/** Palette an emoji tile picks from, keyed off the emoji so it's stable. */
export const AVATAR_TILE_COLORS = [
  '#7C5CFF', '#4CC9F0', '#FF3B6B', '#FF8A3D', '#FFD23F', '#4ADE80', '#A78BFA', '#2DD4BF',
];

export function isEmojiAvatar(url?: string | null): url is string {
  return !!url && url.startsWith('emoji:');
}

export function emojiOf(url: string): string {
  return url.slice('emoji:'.length);
}

/** Deterministic tile color for an emoji avatar. */
export function tileColorFor(url: string): string {
  const emoji = emojiOf(url);
  let sum = 0;
  for (const ch of emoji) sum += ch.codePointAt(0) ?? 0;
  return AVATAR_TILE_COLORS[sum % AVATAR_TILE_COLORS.length];
}
