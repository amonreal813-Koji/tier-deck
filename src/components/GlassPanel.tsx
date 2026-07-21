import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme/tokens';

interface GlassPanelProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Extra tint layered over the glass, e.g. a category accent at low alpha. */
  tint?: string;
  intensity?: number;
}

/**
 * The one glass surface in the app.
 * iOS: real blur. Android: faux glass — expo-blur artifacts over scrolling
 * content there, and against our dark gradient background the faux version
 * reads nearly identically.
 * The 1px top-edge highlight is the detail that sells the material.
 */
export function GlassPanel({ children, style, radius = radii.panel, tint, intensity = 28 }: GlassPanelProps) {
  const shell: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
  };

  // Every layer below is decoration and must never intercept input. On web these
  // are absolutely positioned, and CSS paints positioned elements above static
  // ones — so a bare child (e.g. a TextInput rendered straight into a
  // GlassPanel) would sit *under* them and become unclickable.
  return (
    <View style={[shell, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgRaised, opacity: 0.88 }]}
          pointerEvents="none"
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} pointerEvents="none" />
      {tint ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} pointerEvents="none" />
      ) : null}
      {Platform.OS === 'android' ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        style={[styles.topHighlight, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: colors.surfaceHighlight,
  },
});
