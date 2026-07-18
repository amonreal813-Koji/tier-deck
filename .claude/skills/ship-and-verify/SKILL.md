---
name: ship-and-verify
description: Ship a change to production the Tier Deck way — type-check, commit to master (no secrets), push, watch the Netlify deploy go green, and verify the live change. Use whenever the user says "ship it", "deploy", "push it live", or asks to release/redeploy the app or SEO site.
---

# Ship & verify (Tier Deck)

The whole site (SEO pages + `/app` Expo app) deploys from **one push to `master`**.
Follow these steps in order; don't skip verification.

## 1. Pre-flight
- `npx tsc --noEmit` → must be zero errors. Fix before continuing.
- If the change is observable in a browser, render-test it first (`run` skill /
  preview). State plainly what's verified vs pending.
- **Scan the diff for secrets.** `.env` is gitignored — confirm no keys, tokens,
  or the Supabase `service_role` / `sb_secret_*` value are staged. `git diff --cached`.

## 2. Commit & push
- Commit on **`master`** (this repo's deploy branch — do NOT branch for normal work).
- Message: imperative subject + a short body explaining *why*. End with the
  `Co-Authored-By: Claude ...` trailer (repo is public, so it's safe).
- `git push origin master`.

## 3. Watch the Netlify deploy
Auto-deploys on push. Two ways to confirm it went green:
- **Dashboard (best):** with the user's Chrome connected, read
  `https://app.netlify.com/projects/tier-deck/deploys` — look for the new commit
  hash marked **Published**. The app build runs `expo export`, so it takes
  ~40s–3min (longer than an SEO-only change).
- **No dashboard:** the deployed page content for app-only changes is identical
  before/after, so you can't diff content. Fall back to the bundle check below.

## 4. Verify the live change
- Load the live URL in the browser (bare `tier-deck.netlify.app` → app;
  `/lists`, `/sneaker-brands` → SEO; `/privacy` `/terms` → legal).
- **Env-var / gating changes** are baked into the JS bundle at build time. To
  confirm a var landed, fetch the app shell and grep the entry bundle:
  ```js
  const html = await (await fetch('/app/', {cache:'no-store'})).text();
  const src = html.match(/src="([^"]*_expo\/static\/js\/web\/[^"]+)"/)[1];
  const js = await (await fetch(src, {cache:'no-store'})).text();
  js.includes('hjrrxulovkbnkoelzszi'); // supabase url present?
  js.includes('tierdeck-20');          // amazon tag present?
  ```
  Reminder: **changing a Netlify env var does nothing until a redeploy.**
- For DB-backed features, verify server-side via the public REST endpoint / the
  Supabase dashboard, not just the UI.

## Gotchas
- Env vars live under the **Dreamthorn** Netlify team, not amonreal813's.
- Community stays hidden unless the Supabase env vars are set — that's correct,
  not a bug.
- Report the outcome honestly: if the deploy failed or a step was skipped, say so.
