import React from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { withAlpha } from '@/theme/tierColors';
import { fonts } from '@/theme/tokens';

interface GlowBadgeProps {
  label: string;
  color: string;
  size?: number;
  glowOpacity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A tier label chip with a real cross-platform glow.
 * Android has no colored shadows, so the halo is an SVG radial gradient
 * sized 1.8x the chip; iOS additionally gets a colored shadow for depth.
 */
export function GlowBadge({ label, color, size = 56, glowOpacity = 0.45, style }: GlowBadgeProps) {
  const halo = size * 1.8;
  const gradientId = `glow-${color.replace('#', '')}`;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg
        pointerEvents="none"
        width={halo}
        height={halo}
        style={{ position: 'absolute', top: (size - halo) / 2, left: (size - halo) / 2 }}
      >
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={glowOpacity} />
            <Stop offset="55%" stopColor={color} stopOpacity={glowOpacity * 0.4} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={halo} height={halo} fill={`url(#${gradientId})`} />
      </Svg>
      <View
        style={[
          styles.chip,
          {
            width: size,
            height: size,
            borderRadius: 14,
            backgroundColor: color,
            borderColor: withAlpha('#FFFFFF', 0.35),
          },
          Platform.OS === 'ios' && {
            shadowColor: color,
            shadowOpacity: 0.55,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.label, { fontSize: label.length > 2 ? size * 0.28 : size * 0.42 }]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  label: {
    fontFamily: fonts.display,
    color: '#0A0A0F',
  },
});
