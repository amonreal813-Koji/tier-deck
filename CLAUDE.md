# Tier Deck — project guide for Claude

Universal tier-list app (Expo + React Native + TypeScript, expo-router) with an
SEO marketing site and an optional community backend. Local-first: everything
works with no account and no network beyond public art/search APIs.

## Run & verify
- Dev server (web): use the `run` skill or `preview_start` with launch config
  `tier-deck-web` — **never** start a dev server with raw Bash.
- Routes live at the **root** in dev (`/community`) but under **`/app`** in the
  production export (baseUrl). So dev = `localhost:8081/community`, prod =
  `tier-deck.netlify.app/app/community`. Don't use `/app/...` paths locally.
- First dev load after a code change is slow (Metro rebuilds ~1500 unminified
  modules) — that's normal, not a hang.
- Type-check with `npx tsc --noEmit` before committing. Keep it at zero errors.

## Deploy (one Netlify site does everything)
- Push to **`master`** → Netlify auto-deploys. `master` IS the deploy branch;
  commit there (this repo's established workflow), don't branch for normal work.
- One `netlify.toml` build runs `scripts/build-seo.mjs` (238 static SEO pages)
  **then** `expo export -p web` into `seo-site/app`. Outputs:
  - bare `/` → **301 redirects to `/app`** (the interactive app is the front door)
  - `/app` → the Expo app · `/lists` → SEO hub · `/sneaker-brands` etc. → SEO pages
  - `/privacy`, `/terms` → legal pages
- Site owned by the **Dreamthorn** Netlify team (NOT amonreal813's team). Its
  GitHub is `amonreal813-Koji/tier-deck` (public — no secrets committed).
- `seo-site/` and `dist/` are gitignored build outputs — never commit them.

## Secrets & env
- **Never commit `.env`** (gitignored). `EXPO_PUBLIC_*` vars are baked into the
  bundle at build time, so changing them in Netlify requires a redeploy.
- App reads `EXPO_PUBLIC_AMAZON_TAG` (= `tierdeck-20`); the SEO build reads
  `AMAZON_TAG`. Both must be set in Netlify or Shop links earn nothing.
- Community is gated on `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (both public/RLS-safe). Blank = app runs local-only, community UI hidden.

## Content pipeline
- Curated lists live in `src/data/premade/catalog.json` (+ `expansions.json`),
  merged/sorted by `src/data/premade/index.ts`. ~253 lists, all fact-checked
  with validated art (wiki / itunes / logo specs).
- Add lists via the multi-agent Workflow (author → adversarial fact-check →
  integrate via `scripts/integrate-catalog.mjs`), then validate every image
  in-browser (Node hits Wikipedia rate limits / can't reach Brandfetch).

## Community backend (Supabase)
- Schema in `supabase/schema.sql` — **idempotent, re-run it after any edit**.
  Tables: profiles / published_lists / likes / reports, + like-count trigger,
  collision-safe new-user trigger, unique index on `lower(display_name)`, and
  explicit Data API grants (tables are NOT auto-exposed).
- Feed's author embed must name its FK
  (`profiles!published_lists_author_id_fkey`) — likes & reports also join lists
  to profiles, so an unqualified embed is ambiguous (PGRST201).
- Google OAuth consent screen is still un-verified; users may see the "unverified
  app" screen. v1 = publish/browse/like; comments deferred (moderation cost).

## Conventions
- Match surrounding style. Theme tokens in `src/theme/`; glass/press components
  in `src/components/`. Web drag uses pointer events + DOM hit-testing (not RNGH).
- Verify observable changes in the browser before claiming done; state honestly
  what's verified vs pending.
