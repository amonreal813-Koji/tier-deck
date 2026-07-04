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

## API keys

Three of the four categories work with zero setup. For **video games**:

1. Get a free key (about 1 minute): https://rawg.io/apidocs
2. Put it in `.env`:
   ```
   EXPO_PUBLIC_RAWG_KEY=your_key_here
   ```
3. Restart `npx expo start`.

Optional: a TMDB key (`EXPO_PUBLIC_TMDB_KEY`, from themoviedb.org) upgrades Movies & TV with full TV-show coverage. Without it the app quietly uses iTunes movie search instead.

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
