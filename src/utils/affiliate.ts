/**
 * Affiliate / "Shop" links for product lists, routed to the best retailer per
 * category (Amazon, Best Buy, Sephora, Chewy).
 *
 * Set the matching EXPO_PUBLIC_* env var to your affiliate id to start earning;
 * without it the links still work (they just don't earn). These ids are public
 * by design (they ride in the URL), so EXPO_PUBLIC_ is fine.
 */
const TAGS = {
  amazon: process.env.EXPO_PUBLIC_AMAZON_TAG ?? '',
  bestbuy: process.env.EXPO_PUBLIC_BESTBUY_TAG ?? '',
  sephora: process.env.EXPO_PUBLIC_SEPHORA_TAG ?? '',
  chewy: process.env.EXPO_PUBLIC_CHEWY_TAG ?? '',
} as const;

type Retailer = keyof typeof TAGS;

interface ShopConfig {
  /** Search hint appended to the item name to sharpen the query. */
  hint: string;
  /** Which store to send shoppers to. Defaults to Amazon. */
  retailer?: Retailer;
}

/**
 * Lists where a "Shop" link makes sense, keyed by premade list id. Extend
 * freely — an id that's absent simply shows no link.
 */
const SHOPPABLE: Record<string, ShopConfig> = {
  // beauty → Sephora
  'makeup-brands': { hint: 'makeup', retailer: 'sephora' },
  'fragrance-brands': { hint: 'perfume', retailer: 'sephora' },
  // electronics → Best Buy
  'phone-brands': { hint: 'smartphone', retailer: 'bestbuy' },
  'game-consoles': { hint: 'game console', retailer: 'bestbuy' },
  // pet → Chewy
  'dog-breeds': { hint: 'dog supplies', retailer: 'chewy' },
  'cat-breeds': { hint: 'cat supplies', retailer: 'chewy' },
  // apparel · accessories · grocery · toys → Amazon
  'sneaker-brands': { hint: 'sneakers' },
  'clothing-brands': { hint: 'clothing' },
  'luxury-watch-brands': { hint: 'watch' },
  'chocolate-bars': { hint: 'chocolate bar' },
  'cereals': { hint: 'cereal' },
  'breakfast-cereals': { hint: 'cereal' },
  'chip-brands': { hint: 'chips snack' },
  'hot-sauces': { hint: 'hot sauce' },
  'energy-drinks': { hint: 'energy drink' },
  'sodas': { hint: 'soda' },
  'candy': { hint: 'candy' },
  'board-games': { hint: 'board game' },
  'book-series': { hint: 'book' },
};

const RETAILER_LABEL: Record<Retailer, string> = {
  amazon: 'Amazon',
  bestbuy: 'Best Buy',
  sephora: 'Sephora',
  chewy: 'Chewy',
};

function buildUrl(retailer: Retailer, query: string): string {
  const q = encodeURIComponent(query);
  const tag = TAGS[retailer];
  switch (retailer) {
    case 'bestbuy':
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}${tag ? `&irclickid=${encodeURIComponent(tag)}` : ''}`;
    case 'sephora':
      return `https://www.sephora.com/search?keyword=${q}`;
    case 'chewy':
      return `https://www.chewy.com/s?query=${q}`;
    case 'amazon':
    default:
      return `https://www.amazon.com/s?k=${q}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`;
  }
}

/** Config for a shoppable list, or null when the list isn't shoppable. */
function configFor(listId?: string | null): ShopConfig | null {
  if (!listId) return null;
  return Object.prototype.hasOwnProperty.call(SHOPPABLE, listId) ? SHOPPABLE[listId] : null;
}

/** Whether to show a "Shop" affordance for this list. */
export function isShoppable(listId?: string | null): boolean {
  return configFor(listId) !== null;
}

/** Human name of the retailer an item will open in ("Amazon", "Sephora", …). */
export function retailerName(listId?: string | null): string {
  const cfg = configFor(listId);
  return RETAILER_LABEL[cfg?.retailer ?? 'amazon'];
}

/** Build the shopping URL for an item (routed to the right retailer). */
export function shopUrl(itemName: string, listId?: string | null): string {
  const cfg = configFor(listId);
  const retailer = cfg?.retailer ?? 'amazon';
  const query = cfg?.hint ? `${itemName} ${cfg.hint}` : itemName;
  return buildUrl(retailer, query);
}
