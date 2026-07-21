/**
 * The Netlify build entrypoint. Runs the whole site build, but reuses a cached
 * `expo export` when nothing that affects the app bundle has changed.
 *
 * Why: the app export is the expensive step (minutes); the SEO pages are cheap.
 * Many pushes only touch docs, the SQL schema, netlify config, or the SEO
 * generator — none of which change the app bundle. Rebuilding it for those
 * burned through the free-tier build credits.
 *
 * Correctness: the cache key hashes every input that ends up in the bundle —
 * including src/data/premade (the catalog ships inside the app) — so a content
 * change still forces a fresh export. A stale app can never be served.
 *
 *   node scripts/build-site.mjs
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Netlify persists /opt/build/cache between builds; locally use a gitignored dir.
const CACHE_ROOT = process.env.NETLIFY === 'true' ? '/opt/build/cache/tier-deck' : path.join(ROOT, '.build-cache');
const CACHED_APP = path.join(CACHE_ROOT, 'app');
const HASH_FILE = path.join(CACHE_ROOT, 'app-inputs.sha256');
const APP_OUT = path.join(ROOT, 'seo-site', 'app');

/** Everything whose contents can change the exported web bundle. */
const APP_INPUTS = [
  'src',
  'assets',
  'app.json',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'babel.config.js',
  'metro.config.js',
];

function hashAppInputs() {
  const h = crypto.createHash('sha256');
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p).sort()) walk(path.join(p, entry));
    } else {
      h.update(path.relative(ROOT, p).replace(/\\/g, '/'));
      h.update(fs.readFileSync(p));
    }
  };
  for (const t of APP_INPUTS) walk(path.join(ROOT, t));
  // EXPO_PUBLIC_* are inlined at build time, so they're part of the key.
  const publicEnv = Object.keys(process.env)
    .filter((k) => k.startsWith('EXPO_PUBLIC_'))
    .sort()
    .map((k) => `${k}=${process.env[k]}`)
    .join('\n');
  h.update(publicEnv);
  return h.digest('hex');
}

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

// 1. SEO pages — always (cheap, and they read the catalog). Wipes seo-site/.
run('node scripts/build-seo.mjs');

// 2. App export — reuse the cache when the app's inputs are byte-identical.
const hash = hashAppInputs();
const cachedHash = fs.existsSync(HASH_FILE) ? fs.readFileSync(HASH_FILE, 'utf8').trim() : null;
const cacheUsable = cachedHash === hash && fs.existsSync(path.join(CACHED_APP, 'index.html'));

if (cacheUsable) {
  console.log('▲ app inputs unchanged — restoring cached export (skipping expo export)');
  fs.cpSync(CACHED_APP, APP_OUT, { recursive: true });
} else {
  console.log(cachedHash ? '▲ app inputs changed — re-exporting' : '▲ no cached export — building');
  run('npx expo export -p web --output-dir seo-site/app');
  fs.rmSync(CACHED_APP, { recursive: true, force: true });
  fs.mkdirSync(CACHE_ROOT, { recursive: true });
  fs.cpSync(APP_OUT, CACHED_APP, { recursive: true });
  fs.writeFileSync(HASH_FILE, hash);
  console.log('▲ cached the export for future builds');
}

// 3. Social meta + OG image — always (cheap; depends on BASE_URL, not the bundle).
run('node scripts/finalize-app-meta.mjs');
