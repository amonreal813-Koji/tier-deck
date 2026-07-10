import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { DEFAULT_TIERS } from '@/theme/tierColors';

interface ConfettiBurstProps {
  /** Bump to replay the burst. 0 renders nothing (initial mount). */
  nonce: number;
  /** How many dots fly out. */
  count?: number;
  /** How far they travel, in px. */
  spread?: number;
}

/** Tier-colored dots springing outward — the shared success moment. */
export function ConfettiBurst({ nonce, count = 14, spread = 120 }: ConfettiBurstProps) {
  if (nonce === 0) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <ConfettiDot key={`${nonce}-${i}`} index={i} count={count} spread={spread} />
      ))}
    </View>
  );
}

function ConfettiDot({ index, count, spread }: { index: number; count: number; spread: number }) {
  const t = useSharedValue(0);
  const color = DEFAULT_TIERS[index % DEFAULT_TIERS.length].color;
  // Fan the dots evenly around the circle, with a little jitter per index.
  const angle = (index / count) * Math.PI * 2 + (index % 3) * 0.3;
  const dist = spread * (0.7 + (index % 4) * 0.12);

  useEffect(() => {
    t.value = withDelay(index * 22, withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) }));
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * t.value * dist },
      { translateY: Math.sin(angle) * t.value * dist - t.value * 24 },
      { scale: 1 - t.value * 0.4 },
      { rotateZ: `${t.value * 220}deg` },
    ],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 3,
  },
});
