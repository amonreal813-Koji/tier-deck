import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const { width: W, height: H } = Dimensions.get('window');

function Blob({ id, color, size }: { id: string; color: string; size: number }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.16} />
          <Stop offset="60%" stopColor={color} stopOpacity={0.07} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * The living backdrop: two huge soft radial blobs (brand violet + cyan)
 * drifting on a slow 20s loop behind every screen. Barely there — you feel
 * it more than you see it.
 */
export function AnimatedGradientBg() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);

  const blobA = useAnimatedStyle(() => ({
    transform: [
      { translateX: -W * 0.35 + t.value * W * 0.3 },
      { translateY: -W * 0.3 + t.value * H * 0.15 },
    ],
  }));

  const blobB = useAnimatedStyle(() => ({
    transform: [
      { translateX: W * 0.35 - t.value * W * 0.3 },
      { translateY: H * 0.45 - t.value * H * 0.2 },
    ],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      <Animated.View style={[styles.blob, blobA]}>
        <Blob id="bg-blob-a" color={colors.brandA} size={W * 1.4} />
      </Animated.View>
      <Animated.View style={[styles.blob, blobB]}>
        <Blob id="bg-blob-b" color={colors.brandB} size={W * 1.2} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute' },
});
