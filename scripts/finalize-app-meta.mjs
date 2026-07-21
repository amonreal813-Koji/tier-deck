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

// 1b. PWA: icons + web app manifest, so the app installs to a home screen and
// launches fullscreen with no browser chrome.
const PWA_ICONS = ['pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png', 'apple-touch-icon.png'];
for (const file of PWA_ICONS) {
  const src = path.join(ROOT, 'assets', 'images', file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, file));
  else console.warn(`! assets/images/${file} missing — run scripts/build-icons.mjs`);
}

const manifest = {
  name: 'Tier Deck',
  short_name: 'Tier Deck',
  description: DESC,
  // Installed app opens straight into the app, not the SEO pages.
  start_url: '/app',
  scope: '/app',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0A0A0F',
  theme_color: '#0A0A0F',
  icons: [
    { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('✓ wrote manifest.webmanifest + PWA icons');

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
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#0A0A0F">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Tier Deck">
`;

// Idempotent: the block is fenced by markers, so re-running always replaces it
// with the current tag set (a "does it already have og:image?" check would
// wrongly skip whenever tags are added later).
const START = '<!-- tierdeck:meta -->';
const END = '<!-- /tierdeck:meta -->';
const block = `${START}${meta}${END}`;
const fenced = new RegExp(`${START}[\\s\\S]*?${END}`);

html = fenced.test(html) ? html.replace(fenced, block) : html.replace('</head>', `${block}</head>`);
fs.writeFileSync(APP_HTML, html);
console.log('✓ injected social + PWA meta into seo-site/app/index.html');
