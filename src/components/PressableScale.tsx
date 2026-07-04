import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
}

/**
 * The only way anything tappable is built: springs to 0.96 on press-in,
 * ticks the haptic engine on press. One feel, everywhere.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  haptic = true,
  onPressIn,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, springs.snappy);
        onPressIn?.(e);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
