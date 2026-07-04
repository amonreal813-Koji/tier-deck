import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
  LinearTransition,
} from 'react-native-reanimated';

import { ItemThumb } from '@/components/ItemThumb';
import type { TierItem } from '@/data/types';
import { withAlpha } from '@/theme/tierColors';
import { colors, springs } from '@/theme/tokens';

import { hapticLift, hapticMiss, hapticTick, hitTest, useDrag } from './drag/DragContext';

export const CARD_SIZE = 64;

interface ItemCardProps {
  item: TierItem;
  selected: boolean;
  onTap: () => void;
}

/**
 * The rankable unit. Tap = select for tap-to-place; hold 250ms = lift into
 * the drag layer. While dragged, the source card dims to a faint anchor and
 * a ghost clone tracks the finger in the overlay.
 */
export function ItemCard({ item, selected, onTap }: ItemCardProps) {
  const drag = useDrag();
  const cardRef = useAnimatedRef<Animated.View>();
  const pressScale = useSharedValue(1);
  const grabDX = useSharedValue(0);
  const grabDY = useSharedValue(0);

  const beingDragged = drag.draggingItem?.id === item.id;

  const tap = Gesture.Tap()
    .maxDuration(230)
    .onBegin(() => {
      pressScale.value = withSpring(0.94, springs.snappy);
    })
    .onFinalize(() => {
      pressScale.value = withSpring(1, springs.snappy);
    })
    .onEnd(() => {
      runOnJS(onTap)();
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart((e) => {
      const m = measure(cardRef);
      const px = m ? m.pageX : e.absoluteX - CARD_SIZE / 2;
      const py = m ? m.pageY : e.absoluteY - CARD_SIZE / 2;
      drag.ghostX.value = px;
      drag.ghostY.value = py;
      drag.originX.value = px;
      drag.originY.value = py;
      grabDX.value = e.absoluteX - px;
      grabDY.value = e.absoluteY - py;
      drag.active.value = 1;
      drag.ghostScale.value = withSpring(1.12, springs.bouncy);
      drag.hoverZone.value = '';
      pressScale.value = withSpring(1, springs.snappy);
      runOnJS(hapticLift)();
      runOnJS(drag.beginDrag)(item);
    })
    .onUpdate((e) => {
      drag.ghostX.value = e.absoluteX - grabDX.value;
      drag.ghostY.value = e.absoluteY - grabDY.value;
      const zone = hitTest(
        drag.zones.value,
        e.absoluteY,
        drag.scrollY.value,
        drag.boardTop.value,
        drag.boardBottom.value
      );
      if (zone !== drag.hoverZone.value) {
        drag.hoverZone.value = zone;
        if (zone !== '') runOnJS(hapticTick)();
      }
    })
    .onEnd(() => {
      const zone = drag.hoverZone.value;
      drag.active.value = 0;
      if (zone !== '') {
        drag.hoverZone.value = '';
        runOnJS(drag.commitDrop)(item.id, zone);
        runOnJS(drag.endDrag)();
      } else {
        // No target: the ghost springs home, then dissolves.
        runOnJS(hapticMiss)();
        drag.ghostScale.value = withSpring(1, springs.gentle);
        drag.ghostY.value = withSpring(drag.originY.value, springs.gentle);
        drag.ghostX.value = withSpring(drag.originX.value, springs.gentle, () => {
          runOnJS(drag.endDrag)();
        });
      }
    })
    .onFinalize(() => {
      if (drag.active.value === 1) {
        // Gesture was cancelled mid-drag (e.g. by the system).
        drag.active.value = 0;
        drag.hoverZone.value = '';
        runOnJS(drag.endDrag)();
      }
    });

  const composed = Gesture.Exclusive(pan, tap);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value * (selected ? 1.08 : 1) }],
  }));

  return (
    <Animated.View
      entering={ZoomIn.springify().damping(springs.bouncy.damping).stiffness(springs.bouncy.stiffness)}
      exiting={ZoomOut.duration(140)}
      layout={LinearTransition.springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
      style={[style, selected && styles.lifted, beingDragged && { opacity: 0.2 }]}
    >
      <GestureDetector gesture={composed}>
        <Animated.View
          ref={cardRef}
          accessible
          accessibilityLabel={item.name}
          accessibilityHint={
            selected
              ? 'Selected. Tap a tier label to place it.'
              : 'Tap to select, then tap a tier label. Or hold and drag.'
          }
        >
          <View style={[styles.frame, selected && styles.frameSelected]}>
            <ItemThumb item={item} size={CARD_SIZE} radius={11} />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  frameSelected: {
    borderWidth: 2,
    borderColor: withAlpha(colors.brandA, 0.9),
  },
  lifted: {
    zIndex: 10,
    shadowColor: colors.brandA,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
