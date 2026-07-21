import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { getPremadeList, heroArtFor } from '@/data/premade';
import { resolveArtBatch } from '@/data/premade/art';
import { decodeChallenge, savePendingChallenge } from '@/utils/challenge';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

/**
 * Landing page for a challenge link. Stores the challenger's ranking, then
 * sends the visitor off to rank the same list — the head-to-head shows up on
 * the consensus screen once they've submitted.
 */
export default function ChallengeScreen() {
  const { d } = useLocalSearchParams<{ d: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const challenge = useMemo(() => (d ? decodeChallenge(d) : null), [d]);
  const list = challenge ? getPremadeList(challenge.promptId) : undefined;
  const [art, setArt] = useState<string | null>(null);

  useEffect(() => {
    if (challenge) savePendingChallenge(challenge).catch(() => {});
  }, [challenge]);

  useEffect(() => {
    if (!list) return;
    let alive = true;
    resolveArtBatch([{ id: list.id, art: heroArtFor(list) }], (_id, url) => alive && setArt(url));
    return () => {
      alive = false;
    };
  }, [list]);

  if (!challenge || !list) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.big}>🤷</Text>
        <Text style={styles.h2}>That challenge link looks broken</Text>
        <PressableScale onPress={() => router.replace('/')} style={styles.btn}>
          <Text style={styles.btnText}>Go to Tier Deck</Text>
        </PressableScale>
      </View>
    );
  }

  const itemCount = list.tiers.reduce((n, t) => n + t.items.length, 0);

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <View style={[styles.body, { paddingTop: insets.top + spacing.xxl }]}>
        <Text style={styles.kicker}>YOU'VE BEEN CHALLENGED</Text>
        <Text style={styles.title}>
          {challenge.name} ranked{'\n'}
          {list.title}
        </Text>

        <View style={styles.card}>
          <ItemThumb
            item={{ id: list.id, name: list.title, imageUrl: art, category: list.category }}
            size={84}
            radius={16}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{list.title}</Text>
            <Text style={styles.cardMeta}>{itemCount} things to rank</Text>
          </View>
        </View>

        <Text style={styles.sub}>
          Rank it yourself, then see how much you two actually agree.
        </Text>

        <PressableScale
          onPress={() => router.replace(`/community/rank/${challenge.promptId}` as const)}
          style={{ width: '100%', maxWidth: 460 }}
        >
          <LinearGradient
            colors={[colors.brandA, colors.brandB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Take the challenge →</Text>
          </LinearGradient>
        </PressableScale>

        <PressableScale onPress={() => router.replace('/')} style={styles.skip}>
          <Text style={styles.skipText}>Just browse Tier Deck</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  body: { flex: 1, paddingHorizontal: spacing.lg, width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center' },
  kicker: {
    fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.5,
    color: '#C9BBFF', marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.display, fontSize: type.display, color: colors.textHi, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    borderRadius: radii.panel, marginTop: spacing.xl, width: '100%',
    backgroundColor: withAlpha(colors.brandA, 0.1), borderWidth: 1, borderColor: withAlpha(colors.brandA, 0.35),
  },
  cardTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi },
  cardMeta: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 2 },
  sub: {
    fontFamily: fonts.body, fontSize: type.body, color: colors.textMid,
    textAlign: 'center', marginVertical: spacing.xl,
  },
  cta: {
    height: 54, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
  skip: { marginTop: spacing.lg, padding: spacing.sm },
  skipText: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textLow },
  big: { fontSize: 42 },
  h2: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi, textAlign: 'center' },
  btn: {
    marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
});
