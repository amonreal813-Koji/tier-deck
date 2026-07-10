/**
 * Static SEO site generator.
 *
 * Turns the curated catalog into one crawlable, content-rich HTML page per list
 * (semantic markup + schema.org JSON-LD + affiliate links) plus an index and a
 * sitemap. Deploy the `seo-site/` folder to any static host (Netlify, Vercel,
 * GitHub Pages) to capture "<topic> tier list" search traffic.
 *
 *   BASE_URL=https://tierdeck.app AMAZON_TAG=yourtag-20 node scripts/build-seo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'seo-site');
const BASE_URL = (process.env.BASE_URL || 'https://example.com').replace(/\/$/, '');
const AMAZON_TAG = process.env.AMAZON_TAG || '';

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/premade/catalog.json'), 'utf8'));

// Lists whose items are worth an affiliate "Buy" link → search hint.
const SHOP = {
  'sneaker-brands': 'sneakers', 'clothing-brands': 'clothing', 'luxury-watch-brands': 'watch',
  'fragrance-brands': 'perfume', 'makeup-brands': 'makeup', 'phone-brands': 'smartphone',
  'game-consoles': 'game console', 'chocolate-bars': 'chocolate bar', 'cereals': 'cereal',
  'chip-brands': 'chips snack', 'hot-sauces': 'hot sauce', 'energy-drinks': 'energy drink',
  'sodas': 'soda', 'candy': 'candy', 'board-games': 'board game', 'book-series': 'book',
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const amazon = (name, hint) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(hint ? `${name} ${hint}` : name)}${AMAZON_TAG ? `&tag=${encodeURIComponent(AMAZON_TAG)}` : ''}`;

const CSS = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#07070B;color:#EDEDF2;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
a{color:#B9A5FF;text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:820px;margin:0 auto;padding:32px 20px 80px}
h1{font-size:34px;line-height:1.15;margin:0 0 8px}
.tagline{color:#B7B7C6;font-size:18px;margin:0 0 4px}
.basis{color:#9A9AAC;font-size:14px;margin:16px 0 28px;padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px}
.tier{display:flex;gap:14px;margin:0 0 22px;align-items:flex-start}
.badge{flex:0 0 46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#0A0A0F;font-size:20px}
.items{flex:1;margin:0;padding:0;list-style:none}
.item{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.item:last-child{border-bottom:0}
.item b{font-size:16px}.item .sub{color:#8A8A9A;font-size:13px;margin-left:6px}
.item p{margin:4px 0 0;color:#B7B7C6;font-size:14px}
.buy{display:inline-block;margin-top:6px;font-size:13px;font-weight:600;color:#8BF0B0}
.foot{margin-top:40px;color:#6E6E80;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:24px}
.card{display:block;padding:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;color:#EDEDF2}
.card:hover{border-color:rgba(124,92,255,.5);text-decoration:none}
.card b{display:block;font-size:16px}.card span{color:#8A8A9A;font-size:13px}
.disc{color:#6E6E80;font-size:12px;margin-top:24px}
`;

function pageHtml(list) {
  const url = `${BASE_URL}/${list.id}.html`;
  const desc = list.tagline || `A tier list ranking ${list.title}.`;
  const hint = SHOP[list.id];
  const allItems = list.tiers.flatMap((t) => t.items);
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.title,
    description: desc,
    numberOfItems: allItems.length,
    itemListElement: allItems.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name })),
  };
  const tiers = list.tiers
    .map(
      (t) => `<div class="tier"><div class="badge" style="background:${t.color}">${esc(t.label)}</div>
      <ul class="items">${t.items
        .map(
          (it) => `<li class="item"><b>${esc(it.name)}</b>${it.subtitle ? `<span class="sub">${esc(it.subtitle)}</span>` : ''}
          ${it.reasoning ? `<p>${esc(it.reasoning)}</p>` : ''}
          ${hint ? `<a class="buy" rel="sponsored nofollow" target="_blank" href="${esc(amazon(it.name, hint))}">Shop ${esc(it.name)} →</a>` : ''}</li>`
        )
        .join('')}</ul></div>`
    )
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(list.title)} — Tier List</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(list.title)} — Tier List">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head><body><div class="wrap">
<p><a href="index.html">← All tier lists</a></p>
<h1>${esc(list.title)}</h1>
<p class="tagline">${esc(desc)}</p>
<div class="basis">${esc(list.basis || '')}</div>
${tiers}
${hint ? `<p class="disc">As an Amazon Associate we may earn from qualifying purchases.</p>` : ''}
<p class="foot">◆ Ranked on Tier Deck · make your own at <a href="${BASE_URL}">tierdeck</a></p>
</div></body></html>`;
}

function indexHtml() {
  const cards = catalog
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(
      (l) => `<a class="card" href="${l.id}.html"><b>${esc(l.title)}</b><span>${esc(l.tagline || '')}</span></a>`
    )
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tier Lists — Rank Everything</title>
<meta name="description" content="${catalog.length} fact-checked tier lists ranking movies, games, food, music, sports and more.">
<style>${CSS}</style></head><body><div class="wrap">
<h1>Every Tier List</h1>
<p class="tagline">${catalog.length} fact-checked rankings — tap in for the reasons.</p>
<div class="grid">${cards}</div>
</div></body></html>`;
}

function sitemap() {
  const urls = ['index.html', ...catalog.map((l) => `${l.id}.html`)]
    .map((u) => `<url><loc>${BASE_URL}/${u}</loc></url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const list of catalog) fs.writeFileSync(path.join(OUT, `${list.id}.html`), pageHtml(list));
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml());
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`);
console.log(`Generated ${catalog.length} pages + index + sitemap → seo-site/  (BASE_URL=${BASE_URL}, tag=${AMAZON_TAG || 'none'})`);
