import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { heroArtFor, premadeLists } from '@/data/premade';
import { resolveArtBatch } from '@/data/premade/art';
import { colors, fonts } from '@/theme/tokens';

/**
 * Ambient home backdrop: rows of mini tier-list cards (hero image + S–F color
 * strip) drifting sideways behind the content. Decorative, dim, non-interactive.
 *
 * Motion is a CSS marquee (web): the track holds two identical card sets and
 * slides by exactly one set width (translateX -50%) on an infinite linear loop,
 * so it repeats seamlessly and runs GPU-accelerated. On native it renders
 * static (native build isn't shipped yet).
 */

const CARD_W = 132;
const CARD_H = 94;
const GAP = 14;
const ROW_GAP = 20;
const MAX_ROWS = 12; // rows are generated to fill the viewport, capped here
const MAX_CARDS_PER_ROW = 18;

// A wide spread across the catalog so a single row never repeats an image.
// Capped so home resolves a bounded number of hero images; rows reuse the pool.
const PICKS = premadeLists.filter((_, i) => i % 3 === 0).slice(0, 60);

interface Mini {
  id: string;
  name: string;
  colors: string[];
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
}

// Inject the marquee keyframes + per-row animation rules once (web only).
let injected = false;
function ensureCss() {
  if (Platform.OS !== 'web' || injected || typeof document === 'undefined') return;
  injected = true;
  // One rule per row: alternating direction, staggered speeds so rows never
  // march in lockstep.
  const rules = Array.from({ length: MAX_ROWS }, (_, r) => {
    const duration = 52 + r * 9;
    const dir = r % 2 === 1 ? ' reverse' : '';
    return `[data-tdmq="${r}"] { animation: td-marquee ${duration}s linear infinite${dir}; }`;
  }).join('\n    ');

  const style = document.createElement('style');
  style.textContent = `
    @keyframes td-marquee { to { transform: translate3d(-50%, 0, 0); } }
    [data-tdmq] { will-change: transform; }
    ${rules}
    @media (prefers-reduced-motion: reduce) { [data-tdmq] { animation: none; } }
  `;
  document.head.appendChild(style);
}

/** RNW passes dataSet through as data-* attributes; typed loosely for RN core. */
function marqueeAttr(index: number): Record<string, unknown> {
  return Platform.OS === 'web' ? { dataSet: { tdmq: index } } : {};
}

// The card carries data-td-list (web) so the backdrop click handler can map a
// click straight to its list. It stays hit-testable (below the full-screen
// content, which is why it never captures a real tap directly).
const cardAttr = (id: string): Record<string, unknown> =>
  Platform.OS === 'web' ? { dataSet: { tdList: id } } : {};

function MiniCard({ card, url }: { card: Mini; url?: string | null }) {
  return (
    <View style={styles.card} {...cardAttr(card.id)}>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" />
      ) : (
        // No resolved art (some logo/wiki specs don't produce a thumbnail) →
        // an initials tile so a card is never just an empty box.
        <LinearGradient
          colors={[card.colors[0] ?? '#2a2340', card.colors[3] ?? '#1a1830']}
          style={[StyleSheet.absoluteFill, styles.initialsTile]}
        >
          <Text style={styles.initials}>{initials(card.name)}</Text>
        </LinearGradient>
      )}
      <View style={styles.strip}>
        {card.colors.slice(0, 6).map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
    </View>
  );
}

function Row({ cards, art, top, index }: {
  cards: Mini[];
  art: Record<string, string | null>;
  top: number;
  index: number;
}) {
  const set = (prefix: string) =>
    cards.map((c, i) => <MiniCard key={`${prefix}${i}-${c.id}`} card={c} url={art[c.id]} />);
  // Rows are hit-testable (not pointerEvents:none) so a background card can be
  // found by document.elementsFromPoint — but they sit BELOW the full-screen
  // content, so a card never captures a real tap directly. The click handler in
  // SlidingListsBackdrop routes a click here only when no foreground control was
  // under the cursor.
  return (
    <View style={[styles.row, { top }]}>
      <View style={styles.track} {...marqueeAttr(index)}>
        {set('a')}
        {set('b')}
      </View>
    </View>
  );
}

export function SlidingListsBackdrop() {
  const [art, setArt] = useState<Record<string, string | null>>({});
  const { height, width } = useWindowDimensions();
  const router = useRouter();
  // Enough rows to fill the viewport (plus one, so scrolling never reveals a gap).
  const rowCount = Math.min(MAX_ROWS, Math.max(3, Math.ceil(height / (CARD_H + ROW_GAP)) + 1));
  // The marquee slides by exactly one card set, so a set must be at least as
  // wide as the viewport — otherwise the far side runs out of cards and the
  // loop visibly jumps. +1 card of headroom.
  const cardsPerRow = Math.min(
    MAX_CARDS_PER_ROW,
    Math.max(4, Math.ceil((width || 1280) / (CARD_W + GAP)) + 1)
  );

  useEffect(() => {
    ensureCss();
    let alive = true;
    resolveArtBatch(
      PICKS.map((l) => ({ id: l.id, art: heroArtFor(l) })),
      (id, url) => alive && setArt((a) => ({ ...a, [id]: url }))
    );
    return () => {
      alive = false;
    };
  }, []);

  // Web: a background card is clickable, but ONLY when the click didn't land on
  // a real foreground control. The backdrop lives below the full-screen content,
  // so we can't rely on normal event bubbling — instead we inspect the full
  // hit-stack under the cursor. If any element painted ABOVE the background card
  // is interactive (a button/link/pointer-cursor control, i.e. a tier or a nav
  // card), we do nothing; the tap belongs to the foreground. Only an otherwise
  // "empty" spot — a gap between tiers, the side gutters — routes to the list.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const isInteractive = (el: Element): boolean => {
      if (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link') return true;
      const tag = el.tagName;
      if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')
        return true;
      const ti = (el as HTMLElement).tabIndex;
      if (ti !== undefined && ti >= 0) return true;
      try {
        if (window.getComputedStyle(el).cursor === 'pointer') return true;
      } catch {
        /* getComputedStyle can throw on detached nodes */
      }
      return false;
    };
    const onClick = (e: MouseEvent) => {
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      let cardId: string | null = null;
      let cardIdx = -1;
      for (let i = 0; i < stack.length; i++) {
        const id = (stack[i] as HTMLElement).dataset?.tdList;
        if (id) {
          cardId = id;
          cardIdx = i;
          break;
        }
      }
      if (!cardId) return; // click wasn't over any background card
      // Anything above the card that's a real control means the user aimed at
      // the foreground — leave it alone.
      for (let i = 0; i < cardIdx; i++) {
        if (isInteractive(stack[i])) return;
      }
      router.push(`/premade/${cardId}`);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router]);

  const rows: Mini[][] = useMemo(() => {
    const minis: Mini[] = PICKS.map((l) => ({
      id: l.id,
      name: l.title,
      colors: l.tiers.map((t) => t.color),
    }));
    // Wrap around the pool so every row is filled on any screen size.
    return Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: cardsPerRow }, (_, c) => minis[(r * cardsPerRow + c) % minis.length])
    );
  }, [rowCount, cardsPerRow]);

  return (
    // The wrap itself must NOT be pointerEvents:none, or the cards inside would
    // inherit it and vanish from elementsFromPoint. It's safe: the backdrop sits
    // below the full-screen content, which captures every real tap first.
    <View style={styles.wrap}>
      {rows.map((cards, r) => (
        <Row key={r} cards={cards} art={art} top={30 + r * (CARD_H + ROW_GAP)} index={r} />
      ))}
      <LinearGradient
        colors={[colors.bg, 'transparent', colors.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.22, overflow: 'hidden' },
  row: { position: 'absolute', left: 0, right: 0, height: CARD_H, overflow: 'hidden' },
  // alignSelf keeps the track from stretching to the row's width: it must size
  // to its content (two card sets) so translateX(-50%) slides by exactly one
  // set. Stretched, the loop jumps and the far side runs out of cards.
  track: { flexDirection: 'row', alignSelf: 'flex-start' },
  card: {
    width: CARD_W,
    height: CARD_H,
    flexShrink: 0, // never compress; the loop math depends on exact card widths
    marginRight: GAP,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#15151d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'flex-end',
  },
  strip: { flexDirection: 'row', height: 6 },
  initialsTile: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.display, fontSize: 26, color: 'rgba(255,255,255,0.82)' },
});
