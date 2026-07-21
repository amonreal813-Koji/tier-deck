import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { heroArtFor, premadeLists } from '@/data/premade';
import { resolveArtBatch } from '@/data/premade/art';
import { colors } from '@/theme/tokens';

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
  colors: string[];
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

function MiniCard({ card, url }: { card: Mini; url?: string | null }) {
  return (
    <View style={styles.card}>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" /> : null}
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
  return (
    <View style={[styles.row, { top }]} pointerEvents="none">
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

  const rows: Mini[][] = useMemo(() => {
    const minis: Mini[] = PICKS.map((l) => ({ id: l.id, colors: l.tiers.map((t) => t.color) }));
    // Wrap around the pool so every row is filled on any screen size.
    return Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: cardsPerRow }, (_, c) => minis[(r * cardsPerRow + c) % minis.length])
    );
  }, [rowCount, cardsPerRow]);

  return (
    <View style={styles.wrap} pointerEvents="none">
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
});
