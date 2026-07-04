import { Easing } from 'react-native-reanimated';

export const colors = {
  bg: '#0A0A0F',
  bgRaised: '#12121A',
  surface: 'rgba(255,255,255,0.06)',
  surfaceBorder: 'rgba(255,255,255,0.10)',
  surfaceHighlight: 'rgba(255,255,255,0.14)',
  textHi: '#F2F2F7',
  textMid: 'rgba(242,242,247,0.64)',
  textLow: 'rgba(242,242,247,0.38)',
  brandA: '#7C5CFF',
  brandB: '#4CC9F0',
  danger: '#FF4D6D',
  success: '#4ADE80',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  card: 12,
  panel: 20,
  pill: 999,
} as const;

export const type = {
  display: 32,
  title: 24,
  heading: 18,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/**
 * The only three springs in the app. Every animation references one of these —
 * coherence of motion is what makes the whole thing feel intentional.
 */
export const springs = {
  /** presses, toggles, small UI acknowledgements */
  snappy: { damping: 18, stiffness: 220, mass: 1 },
  /** drops, sheets, screen-level movement */
  gentle: { damping: 15, stiffness: 180, mass: 1 },
  /** pops, badges, celebratory moments */
  bouncy: { damping: 12, stiffness: 200, mass: 1 },
} as const;

export const timing = {
  fade: { duration: 200, easing: Easing.out(Easing.quad) },
} as const;
