# Tier Deck

Rank absolutely everything. A universal tier-list phone app that pulls real data — video games, movies & TV, food & drinks, music — with cover art from public APIs. Search "zelda", stage the results, drag them into glowing S/A/B/C/D/F tiers, export the board as an image.

## Run it on your phone

1. Install **Expo Go** from the App Store / Play Store on your phone.
2. On this computer:
   ```
   npm install
   npx expo start
   ```
3. Scan the QR code in the terminal with your phone (camera app on iPhone, Expo Go on Android). Phone and computer must be on the same Wi-Fi.
   - If it can't connect (firewall / router isolation), use `npx expo start --tunnel` instead.

## Configuration (`.env`)

All configuration lives in a `.env` file. **See [`.env.example`](.env.example)** — it's the annotated, fill-in-the-blanks template listing every variable (search keys **and** affiliate tags), what each does, and where to get it.

```bash
cp .env.example .env   # then fill in what you have, and restart `npx expo start`
```

Everything is optional — the app runs with all blanks. Two groups:

- **Data keys** (richer search): `EXPO_PUBLIC_RAWG_KEY` (games, free from rawg.io), `EXPO_PUBLIC_TMDB_KEY` (TV coverage, free from themoviedb.org). Without them the app falls back to Wikipedia / iTunes.
- **💰 Affiliate tags** (earn commission on "Shop" links): `EXPO_PUBLIC_AMAZON_TAG` is the one to start with — grab it from [Amazon Associates](https://affiliate-program.amazon.com). Best Buy / Sephora / Chewy tags are optional add-ons. Links work without a tag; they just don't pay until it's set. For the SEO site, the same tag goes in the host's env as `AMAZON_TAG` (see [`SEO_DEPLOY.md`](SEO_DEPLOY.md)).

| Category | Source | Key needed? |
|---|---|---|
| 🎮 Video games | RAWG | Yes (free) |
| 🎬 Movies & TV | TMDB → iTunes fallback | Optional |
| 🍜 Food & drinks | TheMealDB + TheCocktailDB | No |
| 🎧 Music | iTunes Search | No |

## How to use

- **+** on the home screen → pick a category → search → tap items to stage them → **Create board**.
- **Drag**: hold a card ~¼ second, it lifts into a ghost; drop it on a tier. Haptic ticks as you cross tier boundaries; drag near the top/bottom edge to auto-scroll.
- **Tap-to-place**: tap a card, then tap a tier's label chip. (Also the accessibility path.)
- **Long-press a tier chip**: rename, recolor, reorder, or delete that tier.
- **Undo / redo** live in the board header. Everything auto-saves (watch the green dot pulse).
- **Long-press a list** on home for duplicate / export / delete (delete has a 5-second undo).
- **Export** renders a clean shareable PNG — share it anywhere or save to photos.

## Architecture notes

- Expo SDK 57 (managed) + TypeScript + expo-router. State in zustand, persistence in AsyncStorage behind `src/store/storage.ts` (swap-in point for MMKV once on a dev build).
- Every category is a `CategoryAdapter` (`src/data/adapters/`). New category = one adapter file + one registry line.
- Drag layer (`src/features/board/drag/`) is a root-overlay ghost tracked by reanimated shared values; tier rows register Y-bands as drop zones, hit-testing runs on the UI thread.
- Design tokens in `src/theme/tokens.ts` — three spring presets, one glass recipe, tier glow via SVG radial halos (Android has no colored shadows).
