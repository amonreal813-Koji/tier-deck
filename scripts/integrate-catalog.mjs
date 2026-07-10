// Reads the workflow result file and writes the new curated lists + expansions
// into the app's data folder. Prints only a compact summary (never the payload).
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/integrate-catalog.mjs <workflow-output.json>');
  process.exit(1);
}

const root = JSON.parse(readFileSync(src, 'utf8'));
const result = root.result ?? root;
const newLists = result.newLists ?? [];
const expansions = result.expansions ?? [];

const VALID_CATS = ['games', 'movies', 'food', 'music', 'books', 'anything'];
const problems = [];

// Basic structural sanity — flag anything the app couldn't render.
for (const l of newLists) {
  if (!l.id || !l.title || !l.tiers) problems.push(`list missing fields: ${l.id ?? '?'}`);
  if (!VALID_CATS.includes(l.category)) problems.push(`bad category ${l.category} on ${l.id}`);
  const ids = new Set();
  for (const t of l.tiers ?? []) {
    for (const it of t.items ?? []) {
      if (!it.art) problems.push(`no art: ${l.id}/${it.id}`);
      if (ids.has(it.id)) problems.push(`dup id: ${l.id}/${it.id}`);
      ids.add(it.id);
    }
  }
}
for (const e of expansions) {
  if (!e.listId || !Array.isArray(e.additions)) problems.push(`bad expansion: ${e.listId ?? '?'}`);
}

writeFileSync('src/data/premade/catalog.json', JSON.stringify(newLists, null, 2));
writeFileSync('src/data/premade/expansions.json', JSON.stringify(expansions, null, 2));

const itemCount = newLists.reduce(
  (n, l) => n + l.tiers.reduce((m, t) => m + (t.items?.length ?? 0), 0),
  0
);
const addCount = expansions.reduce((n, e) => n + (e.additions?.length ?? 0), 0);

console.log(`new lists: ${newLists.length} (${itemCount} items)`);
console.log('  ' + newLists.map((l) => `${l.id}[${l.category}]`).join(', '));
console.log(`expansions: ${expansions.length} lists (+${addCount} items)`);
console.log('  ' + expansions.map((e) => `${e.listId}(+${e.additions.length})`).join(', '));
console.log(`\nstructural problems: ${problems.length}`);
for (const p of problems) console.log('  ! ' + p);
