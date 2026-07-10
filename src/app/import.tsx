import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { PressableScale } from '@/components/PressableScale';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useListsStore } from '@/store/useListsStore';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

/**
 * Opens a shared tier list from a `/import?d=…` link: decodes the payload,
 * saves it as a fresh local list, and jumps into the board. No backend — the
 * board travels entirely in the URL.
 */
export default function ImportScreen() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const router = useRouter();
  const importFromEncoded = useListsStore((s) => s.importFromEncoded);
  const [failed, setFailed] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const param = Array.isArray(d) ? d[0] : d;
    if (!param) {
      setFailed(true);
      return;
    }
    const list = importFromEncoded(param);
    if (!list) {
      setFailed(true);
      return;
    }
    router.replace({ pathname: '/board/[listId]', params: { listId: list.id } });
  }, [d, importFromEncoded, router]);

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <ScreenContainer>
        <View style={styles.center}>
          {failed ? (
            <>
              <Text style={styles.emoji}>🫥</Text>
              <Text style={styles.title}>That link didn’t work</Text>
              <Text style={styles.sub}>The shared list looks incomplete or corrupted.</Text>
              <PressableScale onPress={() => router.replace('/')} style={styles.cta}>
                <Text style={styles.ctaText}>Go home</Text>
              </PressableScale>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.brandA} />
              <Text style={styles.title}>Opening shared list…</Text>
            </>
          )}
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emoji: { fontSize: 40 },
  title: { fontFamily: fonts.display, fontSize: type.heading, color: colors.textHi },
  sub: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.brandA,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFFFFF' },
});
