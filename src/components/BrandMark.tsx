import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

/** The five tier colors, in rank order — the app's core visual motif. */
const TIER_COLORS = ['#FF3B6B', '#FF8A3D', '#FFD23F', '#4ADE80', '#38BDF8'];

/**
 * The Tier Deck wordmark: a row of tier-colored bars above the name. Shared by
 * the splash, error, and not-found screens so those moments feel on-brand
 * rather than like a raw system fallback.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {TIER_COLORS.map((c) => (
          <View key={c} style={[styles.bar, { backgroundColor: c }]} />
        ))}
      </View>
      <Text style={[styles.word, compact && styles.wordCompact]}>Tier Deck</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  bars: { flexDirection: 'row', gap: 5 },
  bar: { width: 26, height: 8, borderRadius: 4 },
  word: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.textHi,
    letterSpacing: 0.5,
  },
  wordCompact: { fontSize: 22 },
});
