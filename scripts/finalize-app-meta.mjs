// Runs LAST in the Netlify build, after `expo export` has written the app shell.
// The app is a JS SPA, so social/link scrapers (iMessage, Discord, Twitter,
// Facebook) that don't run JS would otherwise see no preview data. This:
//   1. copies the committed OG image into the deploy root, and
//   2. injects Open Graph + Twitter meta into seo-site/app/index.html
// so a pasted link (bare domain 301s here) unfurls into a real branded card.
//
//   node scripts/finalize-app-meta.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = (process.env.BASE_URL || 'https://tier-deck.netlify.app').replace(/\/$/, '');
const OG_SRC = path.join(ROOT, 'assets', 'og-cover.png');
const OUT = path.join(ROOT, 'seo-site');
const APP_HTML = path.join(OUT, 'app', 'index.html');

const TITLE = 'Tier Deck — Rank absolutely everything';
const DESC =
  'Make a tier list of anything — games, movies, food, music — drag it into S/A/B/C/D/F, then see what everyone else ranked.';
const IMG = `${BASE_URL}/og-cover.png`;

// 1. Publish the OG image at the deploy root.
if (fs.existsSync(OG_SRC)) {
  fs.copyFileSync(OG_SRC, path.join(OUT, 'og-cover.png'));
  console.log('✓ copied og-cover.png → seo-site/');
} else {
  console.warn('! assets/og-cover.png missing — run scripts/build-og.mjs first');
}

// 2. Inject meta into the app shell.
if (!fs.existsSync(APP_HTML)) {
  console.warn('! seo-site/app/index.html not found — did `expo export` run?');
  process.exit(0);
}
let html = fs.readFileSync(APP_HTML, 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const meta = `
<meta name="description" content="${esc(DESC)}">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${BASE_URL}">
<meta property="og:image" content="${IMG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(TITLE)}">
<meta name="twitter:description" content="${esc(DESC)}">
<meta name="twitter:image" content="${IMG}">
`;

if (html.includes('property="og:image"')) {
  console.log('· app shell already has OG meta, skipping injection');
} else {
  html = html.replace('</head>', `${meta}</head>`);
  fs.writeFileSync(APP_HTML, html);
  console.log('✓ injected social meta into seo-site/app/index.html');
}
