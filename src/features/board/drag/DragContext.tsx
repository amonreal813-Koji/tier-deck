import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ItemThumb } from '@/components/ItemThumb';
import type { TierItem } from '@/data/types';
import { UNRANKED_ZONE, useEditorStore } from '@/store/useEditorStore';
import { colors, springs } from '@/theme/tokens';

import { CARD_SIZE } from '../ItemCard';

export interface ZoneRect {
  /** Content-space (inside the board scroll) or window-space (pinned tray). */
  y: number;
  height: number;
  inScroll: boolean;
}

interface DragContextValue {
  draggingItem: TierItem | null;
  active: SharedValue<number>;
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  ghostScale: SharedValue<number>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  hoverZone: SharedValue<string>;
  zones: SharedValue<Record<string, ZoneRect>>;
  scrollY: SharedValue<number>;
  boardTop: SharedValue<number>;
  boardBottom: SharedValue<number>;
  scrollRef: ReturnType<typeof useAnimatedRef<Animated.ScrollView>>;
  beginDrag: (item: TierItem) => void;
  endDrag: () => void;
  commitDrop: (itemId: string, zone: string) => void;
  registerZone: (id: string, rect: ZoneRect) => void;
  unregisterZone: (id: string) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDrag(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDrag must be used inside DragProvider');
  return ctx;
}

export function hapticTick() {
  Haptics.selectionAsync();
}

export function hapticLift() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticDrop() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMiss() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Resolve which zone the finger is over. Tier rows live in board content
 * space (fold the scroll offset in); the unranked tray is window-space.
 * Bands are Y-only — for tier choice, horizontal position is noise.
 */
export function hitTest(
  zones: Record<string, ZoneRect>,
  fingerY: number,
  scrollYValue: number,
  boardTopValue: number,
  boardBottomValue: number
): string {
  'worklet';
  for (const id in zones) {
    const z = zones[id];
    if (z.inScroll) {
      // Ignore fingers outside the visible board viewport.
      if (fingerY < boardTopValue || fingerY > boardBottomValue) continue;
      const contentY = fingerY - boardTopValue + scrollYValue;
      if (contentY >= z.y && contentY <= z.y + z.height) return id;
    } else if (fingerY >= z.y && fingerY <= z.y + z.height) {
      return id;
    }
  }
  return '';
}

const SCREEN_H = Dimensions.get('window').height;
const EDGE = 90;
const MAX_SPEED = 14;

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [draggingItem, setDraggingItem] = useState<TierItem | null>(null);

  const active = useSharedValue(0);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const ghostScale = useSharedValue(1);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const hoverZone = useSharedValue('');
  const zones = useSharedValue<Record<string, ZoneRect>>({});
  const scrollY = useSharedValue(0);
  const boardTop = useSharedValue(0);
  const boardBottom = useSharedValue(SCREEN_H);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const moveItem = useEditorStore((s) => s.moveItem);

  const beginDrag = useCallback((item: TierItem) => setDraggingItem(item), []);
  const endDrag = useCallback(() => setDraggingItem(null), []);

  const commitDrop = useCallback(
    (itemId: string, zone: string) => {
      hapticDrop();
      moveItem(itemId, zone === UNRANKED_ZONE ? UNRANKED_ZONE : zone);
    },
    [moveItem]
  );

  const registerZone = useCallback(
    (id: string, rect: ZoneRect) => {
      zones.value = { ...zones.value, [id]: rect };
    },
    [zones]
  );

  const unregisterZone = useCallback(
    (id: string) => {
      const { [id]: _out, ...rest } = zones.value;
      zones.value = rest;
    },
    [zones]
  );

  // Edge auto-scroll: only ticks while a drag is live, speed ramps
  // quadratically with edge proximity so it feels analog.
  const frame = useFrameCallback(() => {
    if (active.value !== 1) return;
    const fingerY = ghostY.value + CARD_SIZE / 2;
    const top = boardTop.value;
    const bottom = boardBottom.value;
    let v = 0;
    if (fingerY < top + EDGE) {
      const p = Math.min(1, (top + EDGE - fingerY) / EDGE);
      v = -p * p * MAX_SPEED;
    } else if (fingerY > bottom - EDGE) {
      const p = Math.min(1, (fingerY - (bottom - EDGE)) / EDGE);
      v = p * p * MAX_SPEED;
    }
    if (v !== 0) {
      scrollTo(scrollRef, 0, Math.max(0, scrollY.value + v), false);
    }
  }, false);

  useEffect(() => {
    frame.setActive(draggingItem != null);
  }, [draggingItem, frame]);

  const value = useMemo<DragContextValue>(
    () => ({
      draggingItem,
      active,
      ghostX,
      ghostY,
      ghostScale,
      originX,
      originY,
      hoverZone,
      zones,
      scrollY,
      boardTop,
      boardBottom,
      scrollRef,
      beginDrag,
      endDrag,
      commitDrop,
      registerZone,
      unregisterZone,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draggingItem, beginDrag, endDrag, commitDrop, registerZone, unregisterZone]
  );

  return (
    <DragContext.Provider value={value}>
      {children}
      <DragOverlay />
    </DragContext.Provider>
  );
}

/** The floating ghost card that tracks the finger above everything. */
function DragOverlay() {
  const { draggingItem, ghostX, ghostY, ghostScale } = useDrag();

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: ghostX.value },
      { translateY: ghostY.value },
      { scale: ghostScale.value },
      { rotateZ: '2deg' },
    ],
  }));

  if (!draggingItem) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.ghost, style]}>
      <ItemThumb item={draggingItem} size={CARD_SIZE} radius={12} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 12,
    zIndex: 100,
    shadowColor: colors.brandA,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
