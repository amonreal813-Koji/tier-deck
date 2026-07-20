import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

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
const CARDS_PER_ROW = 6;
const ROWS = 3;

const PICKS = premadeLists.filter((_, i) => i % 13 === 0).slice(0, ROWS * CARDS_PER_ROW);

interface Mini {
  id: string;
  colors: string[];
}

// Inject the marquee keyframes + per-row animation rules once (web only).
let injected = false;
function ensureCss() {
  if (Platform.OS !== 'web' || injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes td-marquee { to { transform: translate3d(-50%, 0, 0); } }
    [data-tdmq] { will-change: transform; }
    [data-tdmq="0"] { animation: td-marquee 52s linear infinite; }
    [data-tdmq="1"] { animation: td-marquee 68s linear infinite reverse; }
    [data-tdmq="2"] { animation: td-marquee 84s linear infinite; }
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
  const set = (prefix: string) => cards.map((c) => <MiniCard key={prefix + c.id} card={c} url={art[c.id]} />);
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
    return Array.from({ length: ROWS }, (_, r) => {
      const slice = minis.slice(r * CARDS_PER_ROW, (r + 1) * CARDS_PER_ROW);
      return slice.length ? slice : minis.slice(0, CARDS_PER_ROW);
    });
  }, []);

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
  track: { flexDirection: 'row' },
  card: {
    width: CARD_W,
    height: CARD_H,
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
