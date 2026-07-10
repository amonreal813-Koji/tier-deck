/** Default tier palette — hot to cool, top to bottom. */
export const DEFAULT_TIERS: { label: string; color: string }[] = [
  { label: 'S', color: '#FF3B6B' },
  { label: 'A', color: '#FF8A3D' },
  { label: 'B', color: '#FFD23F' },
  { label: 'C', color: '#4ADE80' },
  { label: 'D', color: '#38BDF8' },
  { label: 'F', color: '#A78BFA' },
];

/** Swatches offered in the tier color picker. */
export const TIER_SWATCHES: string[] = [
  '#FF3B6B', // hot pink-red
  '#FF8A3D', // orange
  '#FFD23F', // gold
  '#4ADE80', // green
  '#2DD4BF', // teal
  '#38BDF8', // sky
  '#7C5CFF', // violet
  '#A78BFA', // lavender
  '#F472B6', // pink
  '#94A3B8', // slate
];

/** Category accents (mirrored in each adapter, exported here for theming). */
export const CATEGORY_ACCENTS = {
  games: '#7C5CFF',
  movies: '#FF6B9D',
  food: '#FF8A3D',
  music: '#4CC9F0',
  books: '#34D399',
  anime: '#F472B6',
  sports: '#F59E0B',
  anything: '#FFD23F',
} as const;

export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return hex + clamped.toString(16).padStart(2, '0').toUpperCase();
}
