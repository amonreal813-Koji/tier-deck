import type { Category, TierItem, TierList } from '@/data/types';

/**
 * Compact, backend-free sharing: a tier list is squeezed into a small JSON
 * shape and base64url-encoded into a link (`/import?d=…`). No accounts, no
 * server — the whole board rides in the URL.
 */

interface WireItem {
  i: string; // id
  n: string; // name
  u?: string; // imageUrl
  s?: string; // subtitle
}
interface WireTier {
  l: string; // label
  c: string; // color
  it: WireItem[];
}
interface WirePayload {
  v: 1;
  t: string; // title
  c: Category; // category
  ti: WireTier[];
}

/** Draft shape accepted by useListsStore.importList. */
export interface ImportDraft {
  title: string;
  category: Category;
  tiers: { label: string; color: string; items: TierItem[] }[];
}

function toBase64Url(json: string): string {
  // unescape(encodeURIComponent(…)) makes btoa unicode-safe (é, ™, emoji…).
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(param: string): string {
  const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

/** Serialize a saved list into the `d` query param for an import link. */
export function encodeListToParam(list: TierList): string {
  const payload: WirePayload = {
    v: 1,
    t: list.title,
    c: list.category,
    ti: list.tiers.map((tier) => ({
      l: tier.label,
      c: tier.color,
      it: tier.itemIds
        .map((id) => list.items[id])
        .filter(Boolean)
        .map((item) => {
          const w: WireItem = { i: item.id, n: item.name };
          if (item.imageUrl) w.u = item.imageUrl;
          if (item.subtitle) w.s = item.subtitle;
          return w;
        }),
    })),
  };
  return toBase64Url(JSON.stringify(payload));
}

/** Parse an import link's `d` param back into an importable draft, or null. */
export function decodeParamToDraft(param: string): ImportDraft | null {
  try {
    const payload = JSON.parse(fromBase64Url(param)) as WirePayload;
    if (!payload || payload.v !== 1 || !Array.isArray(payload.ti)) return null;
    return {
      title: String(payload.t || 'Shared list'),
      category: payload.c,
      tiers: payload.ti.map((tier) => ({
        label: String(tier.l ?? ''),
        color: String(tier.c ?? '#7C5CFF'),
        items: (tier.it ?? []).map<TierItem>((w) => ({
          id: w.i,
          name: w.n,
          imageUrl: w.u ?? null,
          subtitle: w.s,
          category: payload.c,
        })),
      })),
    };
  } catch {
    return null;
  }
}

/** Absolute import URL for the current origin (web) or an app deep link. */
export function buildShareUrl(list: TierList): string {
  const param = encodeListToParam(list);
  const origin =
    typeof window !== 'undefined' && window.location ? window.location.origin : 'https://tierdeck.app';
  return `${origin}/import?d=${param}`;
}
