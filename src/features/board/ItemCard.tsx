import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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
const DRAG_THRESHOLD = 5;

// Web-only CSS (grab cursor + block native text/image drag). Cast because these
// keys aren't part of React Native's ViewStyle.
const WEB_GRAB = {
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitUserDrag: 'none',
} as unknown as Record<string, unknown>;

interface ItemCardProps {
  item: TierItem;
  selected: boolean;
  onTap: () => void;
  /** Faded out because a board search is active and this isn't a match. */
  dimmed?: boolean;
}

const isWeb = Platform.OS === 'web';

/**
 * Web drop targeting via real DOM hit-testing. Each TierRow / the tray is
 * tagged `id="zone-<id>"`; we walk up from the element under the cursor. This
 * sidesteps the scroll-offset math that's unreliable on react-native-web.
 */
function webHitTest(x: number, y: number): string {
  let el = document.elementFromPoint(x, y) as HTMLElement | null;
  while (el) {
    if (el.id && el.id.startsWith('zone-')) return el.id.slice(5);
    el = el.parentElement;
  }
  return '';
}

/**
 * The rankable unit. On native: tap = select for tap-to-place; hold 250ms =
 * lift into the drag layer (react-native-gesture-handler). On web RNGH's Pan is
 * unreliable, so we drive the drag directly with DOM pointer events + window
 * move/up listeners — a small move starts a real drag, a click still selects.
 */
export function ItemCard({ item, selected, onTap, dimmed = false }: ItemCardProps) {
  return isWeb ? (
    <WebCard item={item} selected={selected} onTap={onTap} dimmed={dimmed} />
  ) : (
    <NativeCard item={item} selected={selected} onTap={onTap} dimmed={dimmed} />
  );
}

/* ------------------------------------------------------------------ */
/* Web: pointer-event drag (bypasses RNGH entirely)                    */
/* ------------------------------------------------------------------ */

function WebCard({ item, selected, onTap, dimmed }: ItemCardProps) {
  const drag = useDrag();
  const hostRef = useRef<View>(null);
  const pressScale = useSharedValue(1);
  const beingDragged = drag.draggingItem?.id === item.id;

  // Mutable drag session state (never triggers re-render).
  const session = useRef<{
    startX: number;
    startY: number;
    dragging: boolean;
    grabDX: number;
    grabDY: number;
  } | null>(null);

  const domNode = useCallback(() => {
    // RNW forwards the View ref to the underlying DOM element.
    return hostRef.current as unknown as HTMLElement | null;
  }, []);

  const beginDrag = useCallback(
    (clientX: number, clientY: number) => {
      const rect = domNode()?.getBoundingClientRect?.();
      const px = rect ? rect.left : clientX - CARD_SIZE / 2;
      const py = rect ? rect.top : clientY - CARD_SIZE / 2;
      drag.ghostX.value = px;
      drag.ghostY.value = py;
      drag.originX.value = px;
      drag.originY.value = py;
      const s = session.current;
      if (s) {
        s.grabDX = clientX - px;
        s.grabDY = clientY - py;
      }
      drag.active.value = 1;
      drag.ghostScale.value = withSpring(1.12, springs.bouncy);
      drag.hoverZone.value = '';
      pressScale.value = withSpring(1, springs.snappy);
      hapticLift();
      drag.beginDrag(item);
    },
    [drag, item, pressScale, domNode]
  );

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      const s = session.current;
      if (!s) return;
      drag.ghostX.value = clientX - s.grabDX;
      drag.ghostY.value = clientY - s.grabDY;
      const zone = webHitTest(clientX, clientY);
      if (zone !== drag.hoverZone.value) {
        drag.hoverZone.value = zone;
        if (zone !== '') hapticTick();
      }
    },
    [drag]
  );

  const finishDrag = useCallback(() => {
    const zone = drag.hoverZone.value;
    drag.active.value = 0;
    if (zone !== '') {
      drag.hoverZone.value = '';
      drag.commitDrop(item.id, zone);
      drag.endDrag();
    } else {
      // No target: spring the ghost home, then dissolve it.
      hapticMiss();
      drag.ghostScale.value = withSpring(1, springs.gentle);
      drag.ghostY.value = withSpring(drag.originY.value, springs.gentle);
      drag.ghostX.value = withSpring(drag.originX.value, springs.gentle, (finished) => {
        'worklet';
        if (finished) runOnJS(drag.endDrag)();
      });
    }
  }, [drag, item.id]);

  // Global listeners live only for the duration of one press; a ref holds the
  // teardown so both pointerup and unmount can call it.
  const teardown = useRef<(() => void) | null>(null);

  const onPointerDown = useCallback(
    (e: { nativeEvent: { clientX: number; clientY: number; button?: number; pointerId?: number } }) => {
      const ne = e.nativeEvent;
      if (ne.button != null && ne.button !== 0) return; // primary button only
      session.current = { startX: ne.clientX, startY: ne.clientY, dragging: false, grabDX: 0, grabDY: 0 };
      pressScale.value = withSpring(0.94, springs.snappy);

      const onMove = (ev: PointerEvent) => {
        const s = session.current;
        if (!s) return;
        if (!s.dragging) {
          if (Math.hypot(ev.clientX - s.startX, ev.clientY - s.startY) < DRAG_THRESHOLD) return;
          s.dragging = true;
          beginDrag(ev.clientX, ev.clientY);
        }
        ev.preventDefault();
        moveDrag(ev.clientX, ev.clientY);
      };
      const onUp = () => {
        const s = session.current;
        session.current = null;
        pressScale.value = withSpring(1, springs.snappy);
        teardown.current?.();
        teardown.current = null;
        if (!s) return;
        if (s.dragging) finishDrag();
        else onTap();
      };

      teardown.current?.();
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      teardown.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
    },
    [beginDrag, moveDrag, finishDrag, onTap, pressScale]
  );

  useEffect(() => () => teardown.current?.(), []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value * (selected ? 1.08 : 1) }],
  }));

  return (
    // No `exiting` on web: reanimated's exit animation lingers as a duplicate
    // when a card moves between tiers. Entering + layout still animate.
    <Animated.View
      entering={ZoomIn.springify().damping(springs.bouncy.damping).stiffness(springs.bouncy.stiffness)}
      layout={LinearTransition.springify()
        .damping(springs.gentle.damping)
        .stiffness(springs.gentle.stiffness)}
      style={[
        style,
        selected && styles.lifted,
        dimmed && !selected && { opacity: 0.22 },
        beingDragged && { opacity: 0.2 },
      ]}
    >
      <Animated.View
        ref={hostRef}
        onPointerDown={onPointerDown}
        accessible
        accessibilityRole="button"
        accessibilityLabel={item.name}
        accessibilityHint="Drag to a tier, or tap to select then tap a tier."
        style={WEB_GRAB as never}
      >
        <View
          // Let pointer events fall through to the host so native image-drag
          // never hijacks the gesture.
          pointerEvents="none"
          style={[styles.frame, selected && styles.frameSelected]}
        >
          <ItemThumb item={item} size={CARD_SIZE} radius={11} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Native: react-native-gesture-handler (unchanged behavior)           */
/* ------------------------------------------------------------------ */

function NativeCard({ item, selected, onTap, dimmed }: ItemCardProps) {
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
      style={[
        style,
        selected && styles.lifted,
        dimmed && !selected && { opacity: 0.22 },
        beingDragged && { opacity: 0.2 },
      ]}
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
