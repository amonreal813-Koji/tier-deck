/**
 * Static SEO site generator.
 *
 * Turns the curated catalog into one crawlable, image-rich HTML page per list
 * (semantic markup + schema.org JSON-LD + affiliate links) plus an index and a
 * sitemap. Resolves each item's artwork to a real image URL at build time
 * (Wikipedia / iTunes / Brandfetch), cached to scripts/seo-art-cache.json so
 * repeat builds are fast and don't re-hit the APIs.
 *
 *   BASE_URL=https://tier-deck.netlify.app AMAZON_TAG=yourtag-20 node scripts/build-seo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'seo-site');
const CACHE_FILE = path.join(__dirname, 'seo-art-cache.json');
const BASE_URL = (process.env.BASE_URL || 'https://example.com').replace(/\/$/, '');
const AMAZON_TAG = process.env.AMAZON_TAG || '';

/**
 * Google AdSense — SEO pages only, never inside the app.
 * Set ADSENSE_CLIENT (e.g. "ca-pub-1234567890123456") in the Netlify env once
 * your account is approved; leave it blank and no ad markup is emitted at all,
 * so the pages stay clean until you're actually earning.
 */
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || '';
const ADSENSE_SLOT = process.env.ADSENSE_SLOT || '';

const adsenseHead = () =>
  ADSENSE_CLIENT
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ADSENSE_CLIENT)}" crossorigin="anonymous"></script>`
    : '';

/** One responsive in-article unit. Renders nothing until AdSense is configured. */
const adUnit = () =>
  ADSENSE_CLIENT
    ? `<div class="ad"><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(ADSENSE_CLIENT)}"${
        ADSENSE_SLOT ? ` data-ad-slot="${esc(ADSENSE_SLOT)}"` : ''
      } data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`
    : '';

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/premade/catalog.json'), 'utf8'));

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
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/* ---------------- artwork resolution (build-time, cached) ---------------- */

const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const artKey = (a) => (a.type === 'wiki' ? `wiki:${a.title}` : a.type === 'logo' ? `logo:${a.domain}` : a.type === 'itunes' ? `itunes:${a.kind}:${a.term}` : a.type === 'url' ? `url:${a.url}` : '');

const UA = 'TierDeckSEO/1.0 (tier-list site generator; contact via github.com/amonreal813-Koji/tier-deck)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wikiBatch(titles) {
  let done = 0;
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(batch.join('|'))}&prop=pageimages&piprop=thumbnail&pithumbsize=400&pilicense=any&format=json&redirects=1`;
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const norm = {};
        for (const m of j.query?.normalized ?? []) norm[m.from] = m.to;
        for (const m of j.query?.redirects ?? []) norm[m.from] = m.to;
        const bySrc = {};
        for (const p of Object.values(j.query?.pages ?? {})) if (p.thumbnail?.source) bySrc[p.title] = p.thumbnail.source;
        const rez = (t) => { let c = t, n = 0; while (norm[c] && n++ < 5) c = norm[c]; return c; };
        for (const t of batch) cache[`wiki:${t}`] = bySrc[rez(t)] || bySrc[t] || null;
        ok = true;
      } catch { await sleep(800 * (attempt + 1)); }
    }
    if (!ok) for (const t of batch) if (!(`wiki:${t}` in cache)) cache[`wiki:${t}`] = null;
    done += batch.length;
    if (done % 500 === 0) console.log(`  …wiki ${done}/${titles.length}`);
    await sleep(120); // be polite; avoids the rate-limit that nukes big runs
  }
}

async function itunes(kind, term) {
  const entity = kind === 'album' ? 'album' : 'tvSeason';
  try {
    const j = await (await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1&country=US`)).json();
    const a = j.results?.[0]?.artworkUrl100;
    return a ? a.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1') : null;
  } catch { return null; }
}

async function resolveAllArt() {
  const specs = [];
  for (const l of catalog) { if (l.heroArt) specs.push(l.heroArt); for (const t of l.tiers) for (const it of t.items) if (it.art) specs.push(it.art); }
  // Wikipedia: batch all uncached titles.
  const wikiTitles = [...new Set(specs.filter((a) => a.type === 'wiki' && !(artKey(a) in cache)).map((a) => a.title))];
  if (wikiTitles.length) { console.log(`Resolving ${wikiTitles.length} Wikipedia images…`); await wikiBatch(wikiTitles); }
  // Brandfetch + direct URLs: no network needed.
  for (const a of specs) {
    const k = artKey(a);
    if (k in cache) continue;
    if (a.type === 'logo') cache[k] = `https://cdn.brandfetch.io/${a.domain}/w/400/h/400`;
    else if (a.type === 'url') cache[k] = a.url;
  }
  // iTunes: one call each (cached), so only new terms ever hit the API.
  const itunesSpecs = [...new Map(specs.filter((a) => a.type === 'itunes' && !(artKey(a) in cache)).map((a) => [artKey(a), a])).values()];
  if (itunesSpecs.length) console.log(`Resolving ${itunesSpecs.length} iTunes covers…`);
  for (const a of itunesSpecs) cache[artKey(a)] = await itunes(a.kind, a.term);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
}

const imgOf = (art) => (art ? cache[artKey(art)] || null : null);

/* ---------------- HTML ---------------- */

const CSS = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#07070B;color:#EDEDF2;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:#B9A5FF;text-decoration:none}
img{display:block}
.wrap{max-width:900px;margin:0 auto;padding:28px 20px 90px}
.top{color:#8A8A9A;font-size:14px;margin:0 0 18px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.12;margin:0 0 6px;background:linear-gradient(90deg,#EDEDF2,#B9A5FF);-webkit-background-clip:text;background-clip:text;color:transparent}
.tagline{color:#C2C2D0;font-size:18px;margin:0 0 4px}
.basis{color:#9A9AAC;font-size:13.5px;margin:16px 0 30px;padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px}
.tier{display:flex;gap:14px;margin:0 0 18px;align-items:flex-start}
.badge{position:sticky;top:14px;flex:0 0 48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#0A0A0F;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
.row{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:12px}
.cell{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.thumb{width:100%;aspect-ratio:1;object-fit:cover;background:#15151d}
.ph{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;color:rgba(255,255,255,.85)}
.cell .body{padding:9px 10px 11px}
.cell b{font-size:14px;line-height:1.25;display:block}
.cell .sub{color:#8A8A9A;font-size:11.5px;margin-top:1px}
.cell p{margin:6px 0 0;color:#AeAeBe;color:#ADADBD;font-size:12px;line-height:1.45}
.buy{display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#8BF0B0}
.ad{margin:30px 0;min-height:90px}
.disc{color:#6E6E80;font-size:12px;margin-top:26px}
.foot{margin-top:34px;color:#6E6E80;font-size:13px}
.cta{display:inline-block;padding:13px 22px;border-radius:999px;font-weight:800;font-size:15px;color:#0A0A0F;background:linear-gradient(90deg,#7C5CFF,#4CC9F0);box-shadow:0 8px 24px rgba(124,92,255,.35);transition:filter .15s}
.cta:hover{filter:brightness(1.07)}
.ctawrap{margin:2px 0 30px}
/* index */
.lede{color:#C2C2D0;font-size:18px;margin:0 0 26px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{display:block;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03);color:#EDEDF2}
.card:hover{border-color:rgba(124,92,255,.55);transform:translateY(-2px)}
.card{transition:transform .15s,border-color .15s}
.hero{width:100%;height:132px;object-fit:cover;background:#15151d}
.herorow{display:flex;height:132px}
.herorow>*{flex:1;height:100%}
.card .cbody{padding:14px 16px}
.card b{display:block;font-size:16px;line-height:1.2}
.card span{display:block;color:#8A8A9A;font-size:13px;margin-top:4px}
.strip{display:flex;height:5px}
.strip>i{flex:1}
`;

function cell(it, hint) {
  const img = imgOf(it.art);
  const thumb = img
    ? `<img class="thumb" loading="lazy" src="${esc(img)}" alt="${esc(it.name)}">`
    : `<div class="ph" style="background:linear-gradient(135deg,#2a2340,#1a1830)">${esc(initials(it.name))}</div>`;
  return `<div class="cell">${thumb}<div class="body"><b>${esc(it.name)}</b>${
    it.subtitle ? `<div class="sub">${esc(it.subtitle)}</div>` : ''
  }${it.reasoning ? `<p>${esc(it.reasoning)}</p>` : ''}${
    hint ? `<a class="buy" rel="sponsored nofollow" target="_blank" href="${esc(amazon(it.name, hint))}">Shop ${esc(it.name)} →</a>` : ''
  }</div></div>`;
}

function pageHtml(list) {
  const url = `${BASE_URL}/${list.id}`;
  const desc = list.tagline || `A tier list ranking ${list.title}.`;
  const hint = SHOP[list.id];
  const allItems = list.tiers.flatMap((t) => t.items);
  const ogImage = imgOf(list.heroArt) || imgOf(allItems.find((i) => imgOf(i.art))?.art) || '';
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: list.title, description: desc,
    numberOfItems: allItems.length,
    itemListElement: allItems.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name })),
  };
  const tiers = list.tiers
    .map((t) => `<div class="tier"><div class="badge" style="background:${t.color}">${esc(t.label)}</div><div class="row">${t.items.map((it) => cell(it, hint)).join('')}</div></div>`)
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(list.title)} — Tier List</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(list.title)} — Tier List">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">${ogImage ? `\n<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
${adsenseHead()}
</head><body><div class="wrap">
<p class="top"><a href="/lists">← All tier lists</a></p>
<h1>${esc(list.title)}</h1>
<p class="tagline">${esc(desc)}</p>
${list.basis ? `<div class="basis">${esc(list.basis)}</div>` : ''}
<div class="ctawrap"><a class="cta" href="/app">✦ Disagree? Make your own →</a></div>
${tiers}
${adUnit()}
${hint ? `<p class="disc">As an Amazon Associate we may earn from qualifying purchases.</p>` : ''}
<p class="foot">◆ Ranked on Tier Deck · <a href="/lists">browse all ${catalog.length} lists</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
</div></body></html>`;
}

function heroFor(list) {
  // Up to 4 item images across the top of the card; fall back to a color strip.
  const imgs = list.tiers.flatMap((t) => t.items).map((i) => imgOf(i.art)).filter(Boolean).slice(0, 4);
  if (imgs.length >= 3) return `<div class="herorow">${imgs.map((u) => `<img class="hero" loading="lazy" src="${esc(u)}" alt="">`).join('')}</div>`;
  if (imgs.length) return `<img class="hero" loading="lazy" src="${esc(imgs[0])}" alt="">`;
  const strip = list.tiers.slice(0, 6).map((t) => `<i style="background:${t.color}"></i>`).join('');
  return `<div class="hero" style="display:flex;flex-direction:column;justify-content:center"><div class="strip" style="height:8px">${strip}</div></div>`;
}

function indexHtml() {
  const cards = catalog
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((l) => {
      const strip = l.tiers.slice(0, 6).map((t) => `<i style="background:${t.color}"></i>`).join('');
      return `<a class="card" href="/${l.id}">${heroFor(l)}<div class="strip">${strip}</div><div class="cbody"><b>${esc(l.title)}</b><span>${esc(l.tagline || '')}</span></div></a>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tier Lists — Rank Everything | Tier Deck</title>
<meta name="description" content="${catalog.length} fact-checked tier lists ranking movies, TV, games, food, music, sports and more — with the reasoning behind every placement.">
<meta property="og:title" content="Tier Deck — ${catalog.length} fact-checked tier lists">
<meta property="og:description" content="Rank everything. ${catalog.length} curated tier lists with real reasoning.">
<style>${CSS}</style>
${adsenseHead()}
</head><body><div class="wrap">
<h1>Every Tier List</h1>
<p class="lede">${catalog.length} fact-checked rankings — tap in for the reasons behind every placement.</p>
<div class="ctawrap"><a class="cta" href="/app">✦ Make your own tier list →</a></div>
<div class="grid">${cards}</div>
${adUnit()}
<p class="foot">◆ Tier Deck · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
</div></body></html>`;
}

/**
 * Legal pages. Bump LEGAL_UPDATED whenever the wording changes — it's hardcoded
 * rather than new Date() so a routine rebuild doesn't churn the "last updated".
 */
const LEGAL_UPDATED = '16 July 2026';

function legalHtml(title, desc, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Tier Deck</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE_URL}/${title.toLowerCase().replace(/\s+/g, '-')}">
<style>${CSS}
.legal h2{font-size:20px;margin:28px 0 8px;color:#EDEDF2}
.legal p,.legal li{color:#C2C2D0;font-size:15px;line-height:1.7}
.legal ul{padding-left:20px}
.legal .upd{color:#8A8A9A;font-size:13px}
</style></head><body><div class="wrap legal">
<p class="top"><a href="/lists">← All tier lists</a> · <a href="/app">Open the app</a></p>
<h1>${esc(title)}</h1>
<p class="upd">Last updated: ${LEGAL_UPDATED}</p>
${bodyHtml}
<p class="foot">◆ Tier Deck · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
</div></body></html>`;
}

function privacyHtml() {
  return legalHtml(
    'Privacy Policy',
    'What Tier Deck collects, why, and how to delete it.',
    `<p>Tier Deck is a tier-list app. This policy explains exactly what we collect and why. Short version: you can use almost all of Tier Deck without an account, and we don't sell your data or run ad trackers.</p>

<h2>If you don't sign in</h2>
<p>Tier lists you create are stored <strong>only on your own device</strong>, in your browser or app storage. We never receive them. Clearing your browser data deletes them permanently — we cannot recover them.</p>

<h2>If you sign in with Google</h2>
<p>Signing in is optional, and only needed to publish lists or like other people's. When you do, we receive and store:</p>
<ul>
  <li>Your <strong>email address</strong>, <strong>display name</strong>, and <strong>profile picture URL</strong> from your Google account. We do not receive your Google password.</li>
  <li>Any <strong>tier lists you publish</strong> (title and items) — these are public to anyone using Tier Deck.</li>
  <li>Which lists you <strong>liked</strong>.</li>
  <li>Any <strong>reports</strong> you file about other people's lists.</li>
</ul>
<p>Your display name and picture are shown publicly next to lists you publish. Your email address is never shown publicly.</p>

<h2>Where it's stored</h2>
<p>Accounts and published content are stored with <a href="https://supabase.com/privacy" rel="noopener" target="_blank">Supabase</a> (our database and login provider). The website is served by <a href="https://www.netlify.com/privacy/" rel="noopener" target="_blank">Netlify</a>. Both may process technical data such as your IP address to deliver the service.</p>

<h2>Other services your browser contacts</h2>
<p>To show artwork and search results, the app fetches data directly from public sources including Wikipedia, the iTunes Search API, TheMealDB, TheCocktailDB, Open Library, Jikan, and (optionally) TMDB and RAWG. Because these requests come from your browser, those services can see your IP address. We don't send them your identity.</p>

<h2>Affiliate links</h2>
<p>Some product lists include "Shop" links to retailers such as Amazon. These carry an affiliate tag, so we may earn a commission if you buy something. Following one of those links takes you to the retailer, who then handles your data under their own privacy policy. As an Amazon Associate we earn from qualifying purchases.</p>

<h2>Analytics and ads</h2>
<p>We don't run advertising networks or third-party analytics trackers on this site.</p>

<h2>Deleting your data</h2>
<p>You can unpublish any list you posted from within the app. To delete your account and everything attached to it, email us and we'll remove it.</p>

<h2>Children</h2>
<p>Tier Deck isn't directed at children under 13, and we don't knowingly collect their data.</p>

<h2>Changes</h2>
<p>If this policy changes materially, we'll update the date above.</p>

<h2>Contact</h2>
<p>Questions or deletion requests: <a href="mailto:kojitheog42@gmail.com">kojitheog42@gmail.com</a></p>`
  );
}

function termsHtml() {
  return legalHtml(
    'Terms of Service',
    'The rules for using Tier Deck.',
    `<p>By using Tier Deck you agree to these terms. They're intentionally short and plain.</p>

<h2>What Tier Deck is</h2>
<p>A free app for making and sharing tier lists. Rankings in our curated lists are opinions and editorial judgments — not statements of fact.</p>

<h2>Your content</h2>
<p>You keep ownership of the tier lists you create. By publishing a list to the community, you grant us permission to display and distribute it within Tier Deck. You're responsible for what you publish, and you confirm you have the right to publish it.</p>

<h2>What you may not publish</h2>
<ul>
  <li>Illegal content, harassment, hate speech, or threats</li>
  <li>Content that targets or exposes private individuals</li>
  <li>Spam, scams, or malware</li>
  <li>Material that infringes someone else's rights</li>
</ul>
<p>We may remove any published list and suspend accounts that break these rules. You can report a list from its page.</p>

<h2>Third-party content</h2>
<p>Item artwork and descriptions come from public sources such as Wikipedia and the iTunes Search API, and remain the property of their respective owners. Brand names and logos belong to their owners and appear for identification only.</p>

<h2>Affiliate links</h2>
<p>Some links to retailers are affiliate links, meaning we may earn a commission on purchases at no extra cost to you. As an Amazon Associate we earn from qualifying purchases.</p>

<h2>No warranty</h2>
<p>Tier Deck is provided "as is", without warranty of any kind. Lists you create without an account live only on your device — back up anything you care about, because we can't recover it. We're not liable for lost data or damages arising from use of the service.</p>

<h2>Changes</h2>
<p>We may update these terms; the date above reflects the latest version. Continuing to use Tier Deck means you accept the current terms.</p>

<h2>Contact</h2>
<p><a href="mailto:kojitheog42@gmail.com">kojitheog42@gmail.com</a></p>`
  );
}

function sitemap() {
  // Root redirects to /app, so the crawlable hub is /lists (not "").
  const urls = ['lists', 'privacy', 'terms', ...catalog.map((l) => l.id)]
    .map((u) => `<url><loc>${BASE_URL}/${u}</loc></url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

await resolveAllArt();
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
// One directory per list → Netlify serves clean URLs (/sneaker-brands) natively.
for (const list of catalog) {
  const dir = path.join(OUT, list.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(list));
}
// The list hub lives at /lists (the bare root 301s to /app). Keep a copy at the
// root too as a harmless fallback if the redirect is ever removed.
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml());
fs.mkdirSync(path.join(OUT, 'lists'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'lists', 'index.html'), indexHtml());
// Legal pages — Google requires a public privacy policy to publish the OAuth app.
for (const [dir, html] of [['privacy', privacyHtml()], ['terms', termsHtml()]]) {
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  fs.writeFileSync(path.join(OUT, dir, 'index.html'), html);
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`);
const resolved = Object.values(cache).filter(Boolean).length;
console.log(`Generated ${catalog.length} pages + index + sitemap → seo-site/  (BASE_URL=${BASE_URL}, tag=${AMAZON_TAG || 'none'}, images cached=${resolved}/${Object.keys(cache).length})`);
