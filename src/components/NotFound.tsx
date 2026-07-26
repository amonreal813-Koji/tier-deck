import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { BrandMark } from '@/components/BrandMark';
import { PressableScale } from '@/components/PressableScale';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

/**
 * Friendly "nothing here" screen — for unknown routes and for list ids that
 * don't exist. Beats a blank void, and always offers a way back home.
 */
export function NotFound({
  title = 'Page not found',
  message = "We couldn't find that page. It may have moved, or never existed.",
}: {
  title?: string;
  message?: string;
}) {
  const router = useRouter();
  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <View style={styles.center}>
        <BrandMark />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <PressableScale style={styles.button} onPress={goHome}>
          <Text style={styles.buttonLabel}>Back to Tier Deck</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textHi,
    marginTop: spacing.lg,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMid,
    textAlign: 'center',
    maxWidth: 340,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.brandA,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  buttonLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
});
