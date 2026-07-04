import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import type { TierItem } from '@/data/types';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, spacing, springs, type } from '@/theme/tokens';

import { UNRANKED_ZONE } from '@/store/useEditorStore';

import { useDrag } from './drag/DragContext';
import { ItemCard } from './ItemCard';

interface UnrankedTrayProps {
  items: TierItem[];
  placing: boolean;
  selectedItemId: string | null;
  onZoneTap: () => void;
  onItemTap: (item: TierItem) => void;
  onAddItems: () => void;
}

/** The pinned bottom pool of unplaced items. */
export function UnrankedTray({
  items,
  placing,
  selectedItemId,
  onZoneTap,
  onItemTap,
  onAddItems,
}: UnrankedTrayProps) {
  const drag = useDrag();
  const shellRef = useRef<View>(null);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (placing) {
      pulse.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      pulse.value = withSpring(0, springs.snappy);
    }
  }, [placing, pulse]);

  const hover = useDerivedValue(() =>
    withTiming(drag.hoverZone.value === UNRANKED_ZONE ? 1 : 0, { duration: 140 })
  );

  const glowStyle = useAnimatedStyle(() => {
    const resting = placing
      ? withAlpha('#FFFFFF', 0.12 + pulse.value * 0.18)
      : 'rgba(255,255,255,0.10)';
    return {
      borderColor: interpolateColor(hover.value, [0, 1], [resting, withAlpha('#FFFFFF', 0.45)]),
    };
  });

  const measureZone = () => {
    // The tray is pinned outside the board scroll → window-space zone.
    shellRef.current?.measureInWindow((_x, y, _w, h) => {
      if (typeof y === 'number' && typeof h === 'number' && h > 0) {
        drag.registerZone(UNRANKED_ZONE, { y, height: h, inScroll: false });
      }
    });
  };

  const { unregisterZone } = drag;
  useEffect(() => () => unregisterZone(UNRANKED_ZONE), [unregisterZone]);

  return (
    <Animated.View ref={shellRef as never} onLayout={measureZone} style={[styles.shell, glowStyle]}>
      <GlassPanel radius={22} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>
            Unranked{items.length > 0 ? ` · ${items.length}` : ''}
          </Text>
          <PressableScale onPress={onAddItems} style={styles.addBtn} hitSlop={8}>
            <Text style={styles.addBtnText}>+ Add items</Text>
          </PressableScale>
        </View>
        {items.length === 0 ? (
          placing ? (
            <PressableScale onPress={onZoneTap} haptic={false} style={styles.emptyDrop}>
              <Text style={styles.emptyDropText}>Tap to send back here</Text>
            </PressableScale>
          ) : (
            <Text style={styles.emptyText}>Everything is ranked. Look at you.</Text>
          )
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
          >
            {placing ? (
              <PressableScale onPress={onZoneTap} haptic={false} style={styles.dropHere}>
                <Text style={styles.dropHereText}>↩</Text>
              </PressableScale>
            ) : null}
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedItemId === item.id}
                onTap={() => onItemTap(item)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textLow,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: 10,
    backgroundColor: withAlpha('#7C5CFF', 0.14),
    borderWidth: 1,
    borderColor: withAlpha('#7C5CFF', 0.4),
  },
  addBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro + 1,
    color: '#B9A5FF',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textLow,
    paddingVertical: spacing.sm,
  },
  emptyDrop: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyDropText: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
  },
  dropHere: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropHereText: {
    fontSize: 20,
    color: colors.textMid,
  },
});
