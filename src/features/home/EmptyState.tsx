import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { DEFAULT_TIERS, withAlpha } from '@/theme/tierColors';
import { colors, fonts, spacing, type } from '@/theme/tokens';

/** Ghost tier board — the default palette at 20%, waiting to be filled. */
function GhostBoard() {
  const rowH = 26;
  const gap = 8;
  const w = 220;
  const h = DEFAULT_TIERS.length * (rowH + gap) - gap;

  return (
    <Svg width={w} height={h}>
      {DEFAULT_TIERS.map((tier, i) => (
        <React.Fragment key={tier.label}>
          <Rect
            x={0}
            y={i * (rowH + gap)}
            width={rowH}
            height={rowH}
            rx={7}
            fill={withAlpha(tier.color, 0.28)}
          />
          <Rect
            x={rowH + gap}
            y={i * (rowH + gap)}
            width={w - rowH - gap}
            height={rowH}
            rx={7}
            fill={withAlpha('#FFFFFF', 0.04)}
            stroke={withAlpha('#FFFFFF', 0.07)}
            strokeWidth={1}
          />
        </React.Fragment>
      ))}
    </Svg>
  );
}

export function EmptyState() {
  return (
    <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.root}>
      <GhostBoard />
      <Text style={styles.headline}>Nothing ranked yet.</Text>
      <Text style={styles.sub}>Bold claim: you have opinions.{'\n'}Tap + to put them in order.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
    gap: spacing.sm,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: type.title,
    color: colors.textHi,
    marginTop: spacing.xl,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 22,
  },
});
