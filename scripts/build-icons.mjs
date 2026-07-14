// Generate Tier Deck's launcher assets from one vector mark: four descending,
// rounded "tier bars" (S/A/B/C rainbow) on the app's near-black background.
// Bars-only (no text) so librsvg rasterizes identically on any machine.
//
//   node scripts/build-icons.mjs
//
// Outputs every PNG app.json references. Re-run after tweaking geometry/colors.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');

const BG = '#0A0A0F';
const TIER = ['#FF3B6B', '#FF8A3D', '#FFD23F', '#4ADE80']; // S / A / B / C

/** Four descending rounded bars, left-aligned, centered in a square box. */
function bars(box, colors = TIER) {
  const barH = box * 0.19;
  const gap = box * 0.08;
  const totalH = barH * 4 + gap * 3;
  const y0 = (box - totalH) / 2; // vertical center inside the box
  const widths = [1.0, 0.9, 0.8, 0.68];
  const r = barH * 0.34;
  return widths
    .map((w, i) => {
      const y = y0 + i * (barH + gap);
      return `<rect x="0" y="${y.toFixed(1)}" width="${(box * w).toFixed(1)}" height="${barH.toFixed(
        1
      )}" rx="${r.toFixed(1)}" fill="${colors[i]}"/>`;
    })
    .join('');
}

/**
 * Compose a full SVG: an optional filled square, with the tier-bars mark
 * scaled to `scale` of the canvas and centered.
 */
function markSvg({ size, scale, bg = null, colors = TIER }) {
  const box = size * scale;
  const off = (size - box) / 2;
  const bgRect = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgRect}<g transform="translate(${off.toFixed(
    1
  )},${off.toFixed(1)})">${bars(box, colors)}</g></svg>`;
}

const png = (svg, w, h = w) =>
  sharp(Buffer.from(svg)).resize(w, h).png();

const jobs = [
  // App icon — full-bleed dark square; the OS applies its own corner mask.
  { file: 'icon.png', svg: markSvg({ size: 1024, scale: 0.56, bg: BG }), w: 1024 },
  // Browser tab favicon — small, dark, still readable.
  { file: 'favicon.png', svg: markSvg({ size: 196, scale: 0.64, bg: BG }), w: 196 },
  // Splash mark — transparent; sits on the splash's dark background.
  { file: 'splash-icon.png', svg: markSvg({ size: 512, scale: 0.72 }), w: 512 },
  // Android adaptive foreground — bars kept inside the ~66% safe zone.
  { file: 'android-icon-foreground.png', svg: markSvg({ size: 1024, scale: 0.5 }), w: 1024 },
  // Android adaptive background — solid brand-dark fill.
  {
    file: 'android-icon-background.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`,
    w: 1024,
  },
  // Android themed (monochrome) — white silhouette; the OS tints it.
  {
    file: 'android-icon-monochrome.png',
    svg: markSvg({ size: 1024, scale: 0.5, colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'] }),
    w: 1024,
  },
];

for (const j of jobs) {
  await png(j.svg, j.w).toFile(join(OUT, j.file));
  console.log('✓', j.file, `${j.w}×${j.w}`);
}
console.log('\nDone — regenerated', jobs.length, 'assets.');
