import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: object;
}

/** Shimmering placeholder — a gradient sweep looping over a dim block. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [x]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: `${x.value * 100}%` as unknown as number }],
  }));

  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surface, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
