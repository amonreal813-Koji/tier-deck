import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { fetchConsensus, fetchTrendingPrompts } from '@/data/community';
import { dailyPromptId, getStreak, rankedToday } from '@/data/dailyPrompt';
import { getPremadeList, heroArtFor, premadeLists } from '@/data/premade';
import { resolveArtBatch } from '@/data/premade/art';
import type { TierItem } from '@/data/types';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

/** A handful of lists to browse & rank, refreshed by rotating through the catalog. */
const BROWSE = premadeLists
  .filter((l) => {
    const n = l.tiers.reduce((c, t) => c + t.items.length, 0);
    return n >= 8 && n <= 22;
  })
  .slice(0, 24);

export default function PromptsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const todayId = useMemo(() => dailyPromptId(), []);
  const today = todayId ? getPremadeList(todayId) : undefined;

  const [art, setArt] = useState<Record<string, string | null>>({});
  const [streak, setStreak] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [trending, setTrending] = useState<{ prompt_id: string; participants: number }[]>([]);

  useEffect(() => {
    getStreak().then(setStreak).catch(() => {});
    rankedToday().then(setDoneToday).catch(() => {});
    fetchTrendingPrompts(8)
      .then((t) => setTrending(t.filter((p) => getPremadeList(p.prompt_id))))
      .catch(() => {});
    if (todayId) fetchConsensus(todayId).then((c) => setTodayCount(c.participants)).catch(() => {});
  }, [todayId]);

  // Hero art for the daily prompt + the browse rail.
  useEffect(() => {
    let alive = true;
    const lists = [...(today ? [today] : []), ...BROWSE];
    resolveArtBatch(
      lists.map((l) => ({ id: l.id, art: heroArtFor(l) })),
      (id, url) => alive && setArt((a) => ({ ...a, [id]: url }))
    );
    return () => {
      alive = false;
    };
  }, [today]);

  const thumbFor = (id: string, name: string): TierItem => ({
    id,
    name,
    imageUrl: art[id] ?? null,
    category: 'anything',
  });

  const go = (id: string) => router.push(`/community/consensus/${id}` as const);

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.back}
          hitSlop={12}
        >
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <Text style={styles.kicker}>Rank &amp; Compare</Text>
        {streak > 0 ? (
          <View style={styles.streak}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Daily prompt */}
          {today ? (
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={styles.sectionLabel}>TODAY'S PROMPT</Text>
              <PressableScale onPress={() => go(today.id)} style={{ marginBottom: spacing.xl }}>
                <LinearGradient
                  colors={[withAlpha(colors.brandA, 0.3), withAlpha(colors.brandB, 0.14)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dailyCard}
                >
                  <ItemThumb item={thumbFor(today.id, today.title)} size={72} radius={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dailyTitle} numberOfLines={2}>{today.title}</Text>
                    <Text style={styles.dailyMeta}>
                      {todayCount === null
                        ? 'Everyone ranks the same list today'
                        : `${todayCount} ${todayCount === 1 ? 'person has' : 'people have'} ranked it`}
                    </Text>
                    <Text style={styles.dailyCta}>{doneToday ? 'See the consensus →' : 'Rank it →'}</Text>
                  </View>
                </LinearGradient>
              </PressableScale>
            </Animated.View>
          ) : null}

          {/* Trending */}
          {trending.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>🔥 TRENDING</Text>
              <View style={{ marginBottom: spacing.xl }}>
                {trending.map((t) => {
                  const l = getPremadeList(t.prompt_id);
                  if (!l) return null;
                  return (
                    <PressableScale key={t.prompt_id} onPress={() => go(t.prompt_id)} style={styles.row}>
                      <ItemThumb item={thumbFor(l.id, l.title)} size={40} radius={9} />
                      <Text style={styles.rowTitle} numberOfLines={1}>{l.title}</Text>
                      <Text style={styles.rowMeta}>{t.participants}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Browse */}
          <Text style={styles.sectionLabel}>RANK ANYTHING</Text>
          <View style={styles.grid}>
            {BROWSE.map((l) => (
              <PressableScale key={l.id} onPress={() => go(l.id)} style={styles.tile}>
                <ItemThumb item={thumbFor(l.id, l.title)} size={92} radius={12} />
                <Text style={styles.tileTitle} numberOfLines={2}>{l.title}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: {
    fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.4,
    textTransform: 'uppercase', color: colors.textLow,
  },
  streak: {
    minWidth: 44, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radii.pill,
    backgroundColor: withAlpha('#FF8A3D', 0.18), borderWidth: 1, borderColor: withAlpha('#FF8A3D', 0.5),
    alignItems: 'center',
  },
  streakText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#FFC08A' },
  body: { paddingHorizontal: spacing.lg, width: '100%', maxWidth: 820, alignSelf: 'center' },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.3,
    color: colors.textLow, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  dailyCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    borderRadius: radii.panel, borderWidth: 1, borderColor: withAlpha(colors.brandA, 0.35),
  },
  dailyTitle: { fontFamily: fonts.display, fontSize: type.heading, color: colors.textHi },
  dailyMeta: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 2 },
  dailyCta: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#C9BBFF', marginTop: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm,
    padding: spacing.sm, borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  rowMeta: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textLow },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { width: 92, alignItems: 'center' },
  tileTitle: {
    fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, color: colors.textHi,
    marginTop: 6, textAlign: 'center',
  },
});
