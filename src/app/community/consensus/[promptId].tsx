import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { fetchConsensus, fetchMyRanking, type Consensus } from '@/data/community';
import { getPremadeList } from '@/data/premade';
import { resolveArtBatch } from '@/data/premade/art';
import type { TierItem } from '@/data/types';
import { useAuth } from '@/store/useAuth';
import { DEFAULT_TIERS, withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

const TIERS = DEFAULT_TIERS.slice(0, 6);

/** Average score (1..6) → tier index (0=S … 5=F). */
function bucket(avg: number): number {
  if (avg >= 5.5) return 0;
  if (avg >= 4.5) return 1;
  if (avg >= 3.5) return 2;
  if (avg >= 2.5) return 3;
  if (avg >= 1.5) return 4;
  return 5;
}

export default function ConsensusScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);

  const list = promptId ? getPremadeList(promptId) : undefined;
  const [art, setArt] = useState<Record<string, string | null>>({});
  const [data, setData] = useState<Consensus | null>(null);
  const [mine, setMine] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const items = useMemo(() => (list ? list.tiers.flatMap((t) => t.items) : []), [list]);
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    let alive = true;
    resolveArtBatch(
      items.map((i) => ({ id: i.id, art: i.art })),
      (id, url) => alive && setArt((a) => ({ ...a, [id]: url }))
    );
    return () => {
      alive = false;
    };
  }, [items]);

  useEffect(() => {
    if (!promptId) return;
    setStatus('loading');
    Promise.all([fetchConsensus(promptId), fetchMyRanking(promptId)])
      .then(([c, m]) => {
        setData(c);
        setMine(m);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [promptId, user]);

  if (!list) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.big}>🤷</Text>
        <Text style={styles.h2}>Prompt not found</Text>
        <PressableScale onPress={() => router.back()} style={styles.btn}><Text style={styles.btnText}>Go back</Text></PressableScale>
      </View>
    );
  }

  const thumb = (id: string): TierItem => ({
    id,
    name: byId[id]?.name ?? id,
    imageUrl: art[id] ?? null,
    subtitle: byId[id]?.subtitle,
    category: list.category,
  });

  const participants = data?.participants ?? 0;
  const consensusItems = data?.items ?? [];
  const avgById = Object.fromEntries(consensusItems.map((c) => [c.item_id, c.avg]));

  // Grouped by consensus tier.
  const grouped: Record<number, typeof consensusItems> = {};
  for (const c of consensusItems) (grouped[bucket(c.avg)] ??= []).push(c);

  // "You vs the crowd": biggest gaps between your score and the average.
  const hotTakes = Object.entries(mine)
    .filter(([id]) => avgById[id] !== undefined)
    .map(([id, myScore]) => ({ id, myScore, avg: avgById[id], diff: myScore - avgById[id] }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  const rankHref = `/community/rank/${promptId}` as const;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <Text style={styles.kicker}>Community Consensus</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={styles.title}>{list.title}</Text>
          <Text style={styles.sub}>
            {status === 'loading' ? 'Tallying the votes…' : `${participants} ${participants === 1 ? 'person' : 'people'} ranked this`}
          </Text>

          {status === 'error' ? (
            <View style={styles.center}>
              <Text style={styles.big}>📡</Text>
              <Text style={styles.h2}>Couldn’t load the consensus</Text>
            </View>
          ) : status === 'ready' && participants === 0 ? (
            <View style={[styles.center, { paddingVertical: spacing.xxl }]}>
              <Text style={styles.big}>🥇</Text>
              <Text style={styles.h2}>Nobody’s ranked this yet</Text>
              <Text style={styles.note}>Be the first — your ranking becomes the consensus.</Text>
            </View>
          ) : status === 'ready' ? (
            <>
              {/* Your hottest takes */}
              {hotTakes.length > 0 ? (
                <View style={styles.takes}>
                  <Text style={styles.takesLabel}>YOU VS. THE CROWD</Text>
                  {hotTakes.map((t) => (
                    <View key={t.id} style={styles.takeRow}>
                      <ItemThumb item={thumb(t.id)} size={34} radius={8} />
                      <Text style={styles.takeName} numberOfLines={1}>{byId[t.id]?.name}</Text>
                      <Text style={[styles.takeDiff, { color: t.diff > 0 ? '#4ADE80' : '#FF8FA8' }]}>
                        {t.diff > 0 ? 'you rate it higher' : 'you rate it lower'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Consensus tier list */}
              {TIERS.map((tier, ti) => {
                const row = (grouped[ti] ?? []).sort((a, b) => b.avg - a.avg);
                return (
                  <View key={tier.label} style={styles.tierRow}>
                    <View style={[styles.badge, { backgroundColor: tier.color }]}>
                      <Text style={styles.badgeText}>{tier.label}</Text>
                    </View>
                    <View style={styles.slot}>
                      {row.length === 0 ? <View style={{ height: 52 }} /> : row.map((c) => (
                        <View key={c.item_id} style={styles.cell}>
                          <ItemThumb item={thumb(c.item_id)} size={52} radius={10} />
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PressableScale onPress={() => router.push(rankHref)} style={{ width: '100%', maxWidth: 560 }}>
          <LinearGradient colors={[colors.brandA, colors.brandB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>{Object.keys(mine).length ? 'Re-rank it →' : 'Rank it yourself →'}</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: { fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textLow },
  body: { paddingHorizontal: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { fontFamily: fonts.display, fontSize: type.title, color: colors.textHi },
  sub: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 4, marginBottom: spacing.lg },
  takes: { marginBottom: spacing.lg, padding: spacing.md, borderRadius: radii.card, backgroundColor: withAlpha('#7C5CFF', 0.1), borderWidth: 1, borderColor: withAlpha('#7C5CFF', 0.3) },
  takesLabel: { fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.2, color: '#C9BBFF', marginBottom: spacing.sm },
  takeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  takeName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textHi },
  takeDiff: { fontFamily: fonts.body, fontSize: type.micro + 1 },
  tierRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  badge: { width: 44, minHeight: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.display, fontSize: 20, color: '#0A0A0F' },
  slot: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cell: { width: 52 },
  big: { fontSize: 42 },
  h2: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi, textAlign: 'center' },
  note: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, alignItems: 'center', backgroundColor: 'rgba(7,7,11,0.92)', borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  cta: { height: 52, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', width: '100%' },
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
  btn: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
});
