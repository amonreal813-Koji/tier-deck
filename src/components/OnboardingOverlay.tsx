import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { storage } from '@/store/storage';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

import { GlassPanel } from './GlassPanel';
import { PressableScale } from './PressableScale';

const SEEN_KEY = 'onboarding:seen:v1';

const TIPS: { glyph: string; title: string; body: string }[] = [
  { glyph: '🃏', title: 'Pick a deck', body: 'Open a curated list or start your own from any category.' },
  { glyph: '✋', title: 'Drag or tap to rank', body: 'Drag a card into a tier — or tap it, then tap a tier label.' },
  { glyph: '📤', title: 'Make it yours', body: 'Disagree with a ranking? Fork it, reshuffle, and export the result.' },
];

/**
 * One-time welcome shown on first launch, gated by a persisted flag. Renders
 * nothing after it's been dismissed once (or while the flag is loading).
 *
 * Home-screen only, and tap-anywhere to dismiss. Both matter: this is a
 * full-screen scrim, so if it ever rode along onto another route it would
 * silently swallow every click there (autoFocus still lands, so an input would
 * accept typing but refuse to focus on click — a genuinely baffling bug).
 */
export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    storage.get<boolean>(SEEN_KEY).then((seen) => {
      if (alive && !seen) setVisible(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    storage.set(SEEN_KEY, true);
  };

  // Never cover a screen the user deliberately navigated to.
  if (!visible || pathname !== '/') return null;

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.scrim} pointerEvents="auto">
      {/* Tapping the scrim dismisses, so it can never trap the user. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss welcome"
      />
      <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.card}>
        <GlassPanel radius={radii.panel} style={StyleSheet.absoluteFill} />
        <View style={styles.inner}>
          <Text style={styles.kicker}>Welcome to</Text>
          <Text style={styles.title}>Tier Deck</Text>
          <Text style={styles.sub}>Rank anything. Three quick things:</Text>

          <View style={styles.tips}>
            {TIPS.map((t) => (
              <View key={t.title} style={styles.tipRow}>
                <Text style={styles.tipGlyph}>{t.glyph}</Text>
                <View style={styles.tipText}>
                  <Text style={styles.tipTitle}>{t.title}</Text>
                  <Text style={styles.tipBody}>{t.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <PressableScale onPress={dismiss} style={styles.cta}>
            <Text style={styles.ctaText}>Let’s go</Text>
          </PressableScale>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,5,9,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 200,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: withAlpha('#7C5CFF', 0.35),
    overflow: 'hidden',
  },
  inner: {
    padding: spacing.xl,
  },
  kicker: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textLow,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: type.display,
    color: colors.textHi,
    marginTop: 2,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.textMid,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  tips: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipGlyph: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: colors.textHi,
  },
  tipBody: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    marginTop: 1,
  },
  cta: {
    backgroundColor: colors.brandA,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: '#FFFFFF',
  },
});
