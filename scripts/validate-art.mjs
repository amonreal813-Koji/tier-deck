// Validates that every art spec in the given JSON files resolves to a real
// image. Usage: node scripts/validate-art.mjs catalog.json expansions.json
// Prints a report of every spec that does NOT resolve, so they can be fixed.

import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/validate-art.mjs <file.json> ...');
  process.exit(1);
}

/** Collect {where, art} from a parsed JSON value (list array or expansion). */
function collect(json, file) {
  const out = [];
  const pushList = (list) => {
    if (list.heroArt) out.push({ where: `${list.id}/hero`, art: list.heroArt });
    for (const tier of list.tiers ?? []) {
      for (const it of tier.items ?? []) {
        out.push({ where: `${list.id}/${it.id}`, art: it.art, name: it.name });
      }
    }
  };
  const arr = Array.isArray(json) ? json : [json];
  for (const entry of arr) {
    if (entry.tiers) pushList(entry);
    else if (entry.additions) {
      for (const add of entry.additions) {
        out.push({ where: `${entry.listId}/${add.item.id}`, art: add.item.art, name: add.item.name });
      }
    }
  }
  return out.map((o) => ({ ...o, file }));
}

async function fetchOk(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(12000) });
    return res;
  } catch {
    return null;
  }
}

async function checkWiki(title, attempt = 0) {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=pageimages&pithumbsize=600&pilicense=any&format=json&redirects=1`;
  const res = await fetchOk(url);
  if (!res) return { ok: false, why: 'wiki api error' };
  const text = await res.text().catch(() => '');
  // Wikipedia returns plaintext "too many requests" under load — back off.
  if (res.status === 429 || text.startsWith('You are making too many')) {
    if (attempt < 7) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      return checkWiki(title, attempt + 1);
    }
    return { ok: false, why: 'rate limited' };
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, why: 'bad wiki response' };
  }
  const pages = json?.query?.pages ?? {};
  for (const id in pages) {
    if (id === '-1' || pages[id].missing !== undefined) return { ok: false, why: 'no such article' };
    if (pages[id]?.thumbnail?.source) return { ok: true };
  }
  return { ok: false, why: 'article has no lead image' };
}

async function checkLogo(domain) {
  const res = await fetchOk(`https://logo.clearbit.com/${domain}?size=256`);
  if (!res) return { ok: false, why: 'logo request failed' };
  if (res.status === 200) return { ok: true };
  return { ok: false, why: `logo ${res.status}` };
}

async function checkItunes(kind, term) {
  const entity = kind === 'tvShow' ? 'tvSeason' : 'album';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1&country=US`;
  const res = await fetchOk(url);
  if (!res || !res.ok) return { ok: false, why: 'itunes api error' };
  const json = await res.json().catch(() => null);
  return json?.results?.[0]?.artworkUrl100 ? { ok: true } : { ok: false, why: 'no itunes result' };
}

async function checkUrl(u) {
  const res = await fetchOk(u, { method: 'GET' });
  return res && res.ok ? { ok: true } : { ok: false, why: `url ${res?.status ?? 'fail'}` };
}

const SKIP_LOGOS = process.env.SKIP_LOGOS === '1';

async function check(art) {
  if (!art) return { ok: false, why: 'null art' };
  if (art.type === 'wiki') return checkWiki(art.title);
  // Clearbit is unreachable from this sandbox though it works in-browser;
  // skip logos here and verify them visually in the preview.
  if (art.type === 'logo') return SKIP_LOGOS ? { ok: true } : checkLogo(art.domain);
  if (art.type === 'itunes') return checkItunes(art.kind, art.term);
  if (art.type === 'url') return checkUrl(art.url);
  return { ok: false, why: `unknown type ${art.type}` };
}

// Gather + de-dupe by spec so we don't hammer the same title twice.
const all = files.flatMap((f) => collect(JSON.parse(readFileSync(f, 'utf8')), f));
const seen = new Map();
for (const e of all) {
  const k = JSON.stringify(e.art);
  if (!seen.has(k)) seen.set(k, e);
}
const specs = [...seen.values()];
console.log(`Checking ${specs.length} unique specs (${all.length} total) …`);

const CONC = 2;
const failures = [];
let done = 0;
for (let i = 0; i < specs.length; i += CONC) {
  const batch = specs.slice(i, i + CONC);
  const results = await Promise.all(
    batch.map(async (e) => {
      const r = await check(e.art);
      return { e, r };
    })
  );
  for (const { e, r } of results) {
    done++;
    if (!r.ok) failures.push({ ...e, why: r.why });
  }
  if (done % 50 < CONC) console.log(`  … ${done}/${specs.length}`);
  await new Promise((r) => setTimeout(r, 650));
}

console.log(`\nDone. ${failures.length} failing specs:\n`);
for (const f of failures) {
  console.log(`  ✗ ${f.where}  [${f.name ?? ''}]  ${JSON.stringify(f.art)}  → ${f.why}`);
}
if (failures.length === 0) console.log('  All images resolve. 🎉');
