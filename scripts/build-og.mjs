// Generate the social share/preview image (Open Graph, 1200x630) for Tier Deck.
// Run locally (where fonts are available) and commit assets/og-cover.png; the
// Netlify build just copies that PNG into the deploy. Re-run after brand tweaks.
//
//   node scripts/build-og.mjs

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'og-cover.png');

const TIER = [
  { l: 'S', c: '#FF3B6B' },
  { l: 'A', c: '#FF8A3D' },
  { l: 'B', c: '#FFD23F' },
  { l: 'C', c: '#4ADE80' },
  { l: 'D', c: '#38BDF8' },
  { l: 'F', c: '#A78BFA' },
];

// Six tier chips in a row, centered under the wordmark.
const chipW = 120;
const chipH = 120;
const gap = 20;
const rowW = TIER.length * chipW + (TIER.length - 1) * gap;
const rowX = (1200 - rowW) / 2;
const rowY = 360;
const chips = TIER.map((t, i) => {
  const x = rowX + i * (chipW + gap);
  return `<rect x="${x}" y="${rowY}" width="${chipW}" height="${chipH}" rx="24" fill="${t.c}"/>
    <text x="${x + chipW / 2}" y="${rowY + chipH / 2 + 26}" text-anchor="middle" font-family="Arial, sans-serif" font-size="66" font-weight="800" fill="#0A0A0F">${t.l}</text>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="wm" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#EDEDF2"/>
      <stop offset="1" stop-color="#B9A5FF"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0A0A0F"/>
  <text x="600" y="215" text-anchor="middle" font-family="Arial, sans-serif" font-size="130" font-weight="800" fill="url(#wm)">Tier Deck</text>
  <text x="600" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" fill="#C2C2D0">Rank absolutely everything.</text>
  ${chips}
  <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#7C5CFF">tier-deck.netlify.app</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log('✓ wrote', OUT, '(1200×630)');
