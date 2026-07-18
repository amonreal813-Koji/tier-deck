---
name: expand-content
description: Add new curated tier lists (or expand existing ones) to Tier Deck's catalog with fact-checked rankings and validated artwork, then integrate and rebuild the SEO site. Use when the user asks to add more lists, expand content, "keep adding", create new tier lists for the catalog, or grow the curated library.
---

# Expand curated content (Tier Deck)

Curated lists live in `src/data/premade/catalog.json` (+ `expansions.json`),
merged and sorted by `src/data/premade/index.ts`. Every list must be
**fact-checked** and every item must have **validated artwork**. Never add
unverified rankings or guessed image specs.

## 1. Generate with a verification Workflow
Use the multi-agent **Workflow** tool (not a single agent) so authoring and
fact-checking are separate, adversarial passes:
- **Author stage:** produce lists to a strict JSON schema matching the existing
  catalog shape — `{id, title, category, tagline, basis, tiers:[{label,color,
  items:[{name, subtitle?, reasoning?, art}]}]}`. Categories are the `Category`
  union in `src/data/types.ts`.
- **Fact-check stage:** an independent agent adversarially verifies every
  ranking/claim and flags anything wrong; apply corrections before integrating.
- Scale the fleet to the ask ("a few" vs "be comprehensive").

### Art specs (get these right — they drive image resolution)
Each item's `art` is one of:
- `{ kind: 'wiki', title: '<exact Wikipedia article title>' }` — people, games,
  shows, franchises. Films/TV need the infobox poster (`pilicense=any`).
- `{ kind: 'itunes', entity: 'album'|'song'|'tvShow', term: '<search term>' }` —
  music covers and TV tiles (square). **iTunes movie search is empty — use wiki
  for films.**
- `{ kind: 'logo', domain: '<brand-domain.com>' }` — brands/products (Brandfetch).

## 2. Integrate
- `node scripts/integrate-catalog.mjs` writes/appends `catalog.json` /
  `expansions.json`. Don't hand-edit unless fixing one field.
- If a Workflow hit a spend limit mid-run, recover the authored JSON from the
  transcript `agent-*.jsonl` StructuredOutput tool_use inputs.

## 3. Validate every image IN-BROWSER (required)
Node hits Wikipedia rate limits and can't reach Brandfetch, so validate via the
browser (`preview_start` + `javascript_tool`):
- **wiki:** Wikipedia `pageimages` with `origin=*&pilicense=any` returns a thumb.
- **logo:** load the Brandfetch URL via `Image()` + canvas, check non-transparent
  pixels (a blank tile = wrong domain).
- **itunes:** the search term returns a result with artwork.
Fix every failure: correct the domain, switch to an alternate exact wiki title,
use an itunes tvShow, or (only for truly imageless obscure items) accept the
styled initials-tile fallback that `ItemThumb` renders on error/null. The final
failure set should be *only* intentional fallbacks.

## 4. Rebuild + ship
- `node scripts/build-seo.mjs` regenerates the SEO pages (fast — art cache in
  `scripts/seo-art-cache.json`; new items resolve on first run).
- Type-check, then hand off to the **ship-and-verify** skill (commit → push →
  confirm the Netlify deploy → spot-check a few new lists live).

## Guardrails
- Don't inflate counts or claim "all images validated" unless the in-browser
  pass actually ran and you fixed the failures.
- Keep rankings defensible — this is fact-checked editorial content, the whole
  point of "The Consensus".
