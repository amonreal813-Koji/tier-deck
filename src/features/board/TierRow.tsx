import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  LinearTransition,
} from 'react-native-reanimated';

import { GlowBadge } from '@/components/GlowBadge';
import { PressableScale } from '@/components/PressableScale';
import type { Tier, TierItem } from '@/data/types';
import { withAlpha } from '@/theme/tierColors';
import { spacing, springs } from '@/theme/tokens';

import { useDrag } from './drag/DragContext';
import { ItemCard } from './ItemCard';

interface TierRowProps {
  tier: Tier;
  items: TierItem[];
  /** True while some card is tap-selected — the chip pulses as a drop target. */
  placing: boolean;
  selectedItemId: string | null;
  onChipTap: () => void;
  onChipLongPress: () => void;
  onItemTap: (item: TierItem) => void;
}

export function TierRow({
  tier,
  items,
  placing,
  selectedItemId,
  onChipTap,
  onChipLongPress,
  onItemTap,
}: TierRowProps) {
  const drag = useDrag();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (placing) {
      pulse.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      pulse.value = withSpring(0, springs.snappy);
    }
  }, [placing, pulse]);

  const { unregisterZone } = drag;
  useEffect(() => () => unregisterZone(tier.id), [unregisterZone, tier.id]);

  // 0 → resting, 1 → the dragged ghost is hovering this row.
  const hover = useDerivedValue(() =>
    withTiming(drag.hoverZone.value === tier.id ? 1 : 0, { duration: 140 })
  );

  const chipPulse = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 + hover.value * 0.08 }],
  }));

  const rowGlow = useAnimatedStyle(() => {
    const resting = placing
      ? withAlpha(tier.color, 0.25 + pulse.value * 0.25)
      : 'rgba(255,255,255,0.07)';
    return {
      borderColor: interpolateColor(hover.value, [0, 1], [resting, withAlpha(tier.color, 0.65)]),
      backgroundColor: interpolateColor(
        hover.value,
        [0, 1],
        ['rgba(255,255,255,0.03)', withAlpha(tier.color, 0.10)]
      ),
    };
  });

  return (
    <Animated.View
      layout={LinearTransition.springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
      onLayout={(e) => {
        // Rows are direct children of the board scroll content, so layout.y
        // is already content-space. Fires again whenever the row grows.
        drag.registerZone(tier.id, {
          y: e.nativeEvent.layout.y,
          height: e.nativeEvent.layout.height,
          inScroll: true,
        });
      }}
      style={styles.row}
    >
      <PressableScale
        onPress={onChipTap}
        onLongPress={onChipLongPress}
        delayLongPress={300}
        scaleTo={0.92}
        accessibilityLabel={`Tier ${tier.label}`}
        accessibilityHint="Tap to place the selected item here. Long press for tier settings."
      >
        <Animated.View style={chipPulse}>
          <GlowBadge label={tier.label} color={tier.color} size={56} glowOpacity={placing ? 0.6 : 0.4} />
        </Animated.View>
      </PressableScale>

      <Animated.View style={[styles.itemsArea, rowGlow]}>
        {items.length === 0 ? <View style={styles.emptyHint} /> : null}
        <View style={styles.itemsWrap}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selectedItemId === item.id}
              onTap={() => onItemTap(item)}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemsArea: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.xs,
    justifyContent: 'center',
  },
  emptyHint: {
    height: 56,
  },
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    padding: 2,
  },
});
