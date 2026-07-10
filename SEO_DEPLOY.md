# Deploying the SEO site (and how it makes money)

## What this is

`scripts/build-seo.mjs` turns your 238 curated tier lists into **238 plain web pages**
(one per list) that Google can find. Each page has the ranking, the reasons, and —
for product lists — **affiliate "Shop" links**. The folder it builds is `seo-site/`.

## How the money works (plain version)

1. **Someone Googles** e.g. "best pizza toppings tier list" or "sneaker brands ranked".
2. **Google shows your page** (because these pages are built to be found).
3. They read it, and on product lists they click a **"Shop" link**.
4. That link goes to Amazon/Best Buy/Sephora with **your tracking code** attached.
5. If they buy *anything* in the next 24 hours, **you get a commission** (a few %).

More pages found by Google → more visitors → more clicks → more commission.
That's the whole loop. The app is the brand; the SEO pages are the storefront window.

You also earn nothing until you plug in your tracking codes — see below.

## One-time setup

1. **Get an Amazon Associates tag** (free): https://affiliate-program.amazon.com →
   sign up → you get a tag like `yourname-20`.
2. **Pick a host** (both free to start):
   - **Netlify** — uses `netlify.toml` (already in this repo).
   - **Vercel** — uses `vercel.json` (already in this repo).
3. Push this repo to GitHub, import it on Netlify/Vercel, and set two env vars:
   - `BASE_URL` = your site's URL (e.g. `https://tierdeck.app`)
   - `AMAZON_TAG` = your Amazon tag (e.g. `yourname-20`)
4. Deploy. Done — every future push rebuilds all pages automatically.

## Build it locally to preview

```bash
BASE_URL=https://tierdeck.app AMAZON_TAG=yourname-20 npm run build:seo
# open seo-site/index.html in a browser
```

## What to do next (to actually earn)

- **Buy a domain** ($10/yr) and point it at the host — real domains rank better.
- **Grow the pages**: every new list you add is another page Google can find.
- **Add more affiliate programs** later (Best Buy, Sephora, Chewy) — the code already
  routes to them; you just add their tags as `EXPO_PUBLIC_BESTBUY_TAG`, etc.
