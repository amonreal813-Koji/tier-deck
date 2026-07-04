import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PressableScale } from '@/components/PressableScale';
import { colors, fonts, type } from '@/theme/tokens';

const SIZE = 60;
const HALO = SIZE * 2.2;

interface FABProps {
  onPress: () => void;
}

/** The "new tier list" button: gradient pill with a slow idle glow pulse. */
export function FAB({ onPress }: FABProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 0.92 + pulse.value * 0.12 }],
  }));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]}>
        <Svg width={HALO} height={HALO}>
          <Defs>
            <RadialGradient id="fab-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.brandA} stopOpacity={0.45} />
              <Stop offset="60%" stopColor={colors.brandB} stopOpacity={0.14} />
              <Stop offset="100%" stopColor={colors.brandB} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={HALO} height={HALO} fill="url(#fab-halo)" />
        </Svg>
      </Animated.View>
      <PressableScale onPress={onPress} scaleTo={0.92} accessibilityLabel="New tier list">
        <LinearGradient
          colors={[colors.brandA, colors.brandB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.plus}>+</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  plus: {
    fontFamily: fonts.display,
    fontSize: type.display,
    color: '#FFFFFF',
    marginTop: -3,
  },
});
