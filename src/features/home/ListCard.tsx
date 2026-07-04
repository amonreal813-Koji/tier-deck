import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import type { TierList } from '@/data/types';
import { CATEGORY_ACCENTS, withAlpha } from '@/theme/tierColors';
import { colors, fonts, spacing, springs, type } from '@/theme/tokens';

const CATEGORY_GLYPHS: Record<string, string> = {
  games: '🎮',
  movies: '🎬',
  food: '🍜',
  music: '🎧',
};

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/**
 * The mini tier strip: six thin bars whose flex is proportional to the item
 * count in each tier — an instant visual fingerprint of the list.
 */
function MiniTierStrip({ list }: { list: TierList }) {
  const total = list.tiers.reduce((n, t) => n + t.itemIds.length, 0);
  return (
    <View style={styles.strip}>
      {list.tiers.map((tier) => {
        const weight = total === 0 ? 1 : Math.max(tier.itemIds.length, 0.15);
        return (
          <View
            key={tier.id}
            style={{
              flex: weight,
              backgroundColor: total === 0 ? withAlpha(tier.color, 0.25) : tier.color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </View>
  );
}

interface ListCardProps {
  list: TierList;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}

export function ListCard({ list, index, onPress, onLongPress }: ListCardProps) {
  const ranked = list.tiers.reduce((n, t) => n + t.itemIds.length, 0);
  const totalItems = ranked + list.unrankedIds.length;
  const accent = CATEGORY_ACCENTS[list.category] ?? colors.brandA;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40)
        .springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
      exiting={FadeOutLeft.duration(180)}
      layout={LinearTransition.springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
    >
      <PressableScale onPress={onPress} onLongPress={onLongPress} delayLongPress={350}>
        <GlassPanel style={styles.panel}>
          <View style={styles.body}>
            <View style={[styles.glyph, { backgroundColor: withAlpha(accent, 0.16), borderColor: withAlpha(accent, 0.35) }]}>
              <Text style={styles.glyphText}>{CATEGORY_GLYPHS[list.category] ?? '⭐'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {list.title}
              </Text>
              <Text style={styles.meta}>
                {totalItems} item{totalItems === 1 ? '' : 's'} · {relativeTime(list.updatedAt)}
              </Text>
            </View>
          </View>
          <MiniTierStrip list={list} />
        </GlassPanel>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: spacing.md,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  glyph: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  glyphText: { fontSize: 20 },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textLow,
    marginTop: 2,
  },
  strip: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
