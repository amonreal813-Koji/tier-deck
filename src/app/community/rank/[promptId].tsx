import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { getPremadeList } from '@/data/premade';
import { resolveArtBatch } from '@/data/premade/art';
import { fetchMyRanking, submitRanking, tierScore } from '@/data/community';
import type { TierItem } from '@/data/types';
import { useAuth } from '@/store/useAuth';
import { DEFAULT_TIERS } from '@/theme/tierColors';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

const TIERS = DEFAULT_TIERS.slice(0, 6); // S A B C D F

export default function RankScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signInWithGoogle);

  const list = promptId ? getPremadeList(promptId) : undefined;
  const items = useMemo(() => (list ? list.tiers.flatMap((t) => t.items) : []), [list]);

  const [art, setArt] = useState<Record<string, string | null>>({});
  const [placed, setPlaced] = useState<Record<string, number>>({}); // itemId -> tier index
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  // Prefill from a previous submission (score 6..1 -> tier index 0..5).
  useEffect(() => {
    if (!user || !promptId) return;
    fetchMyRanking(promptId).then((scores) => {
      const p: Record<string, number> = {};
      for (const [id, score] of Object.entries(scores)) p[id] = 6 - score;
      setPlaced(p);
    });
  }, [user, promptId]);

  if (!list) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.bigGlyph}>🤷</Text>
        <Text style={styles.emptyTitle}>Prompt not found</Text>
        <PressableScale onPress={() => router.back()} style={styles.retry}>
          <Text style={styles.retryText}>Go back</Text>
        </PressableScale>
      </View>
    );
  }

  const thumb = (item: { id: string; name: string; subtitle?: string }): TierItem => ({
    id: item.id,
    name: item.name,
    imageUrl: art[item.id] ?? null,
    subtitle: item.subtitle,
    category: list.category,
  });

  const unranked = items.filter((i) => placed[i.id] === undefined);
  const placedCount = items.length - unranked.length;

  const place = (tierIndex: number) => {
    if (!selected) return;
    Haptics.selectionAsync();
    setPlaced((p) => ({ ...p, [selected]: tierIndex }));
    setSelected(null);
  };
  const unrank = () => {
    if (!selected) return;
    Haptics.selectionAsync();
    setPlaced((p) => {
      const { [selected]: _removed, ...rest } = p;
      return rest;
    });
    setSelected(null);
  };

  const submit = async () => {
    if (busy) return;
    if (!user) {
      toast('Sign in to submit your ranking.');
      signIn();
      return;
    }
    if (placedCount < 1) {
      toast('Rank at least one item first.');
      return;
    }
    setBusy(true);
    try {
      const scored = Object.entries(placed).map(([itemId, ti]) => ({ itemId, score: tierScore(ti) }));
      await submitRanking(promptId, scored);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/community/consensus/${promptId}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not submit. Try again.');
      setBusy(false);
    }
  };

  const ItemTile = ({ item }: { item: (typeof items)[number] }) => {
    const on = selected === item.id;
    return (
      <PressableScale onPress={() => setSelected((s) => (s === item.id ? null : item.id))} style={[styles.tile, on && styles.tileOn]}>
        <ItemThumb item={thumb(item)} size={52} radius={10} />
      </PressableScale>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <Text style={styles.kicker} numberOfLines={1}>Rank · {list.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>
        {selected ? 'Now tap a tier to place it' : 'Tap an item, then tap a tier'}
      </Text>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {TIERS.map((tier, ti) => (
            <PressableScale key={tier.label} onPress={() => place(ti)} scaleTo={1} haptic={false}>
              <View style={styles.tierRow}>
                <View style={[styles.badge, { backgroundColor: tier.color }]}>
                  <Text style={styles.badgeText}>{tier.label}</Text>
                </View>
                <View style={[styles.slot, selected && styles.slotArmed]}>
                  {items.filter((i) => placed[i.id] === ti).map((item) => (
                    <ItemTile key={item.id} item={item} />
                  ))}
                </View>
              </View>
            </PressableScale>
          ))}

          {/* Unranked tray */}
          <PressableScale onPress={unrank} scaleTo={1} haptic={false}>
            <View style={styles.trayHead}>
              <Text style={styles.trayLabel}>UNRANKED · {unranked.length}</Text>
            </View>
            <View style={[styles.tray, selected && styles.slotArmed]}>
              {unranked.length === 0 ? (
                <Text style={styles.trayEmpty}>Everything's ranked 🎉</Text>
              ) : (
                unranked.map((item) => <ItemTile key={item.id} item={item} />)
              )}
            </View>
          </PressableScale>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PressableScale onPress={submit} disabled={busy} style={[{ width: '100%', maxWidth: 560 }, busy && { opacity: 0.6 }]}>
          <LinearGradient colors={[colors.brandA, colors.brandB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
            <Text style={styles.submitText}>
              {busy ? 'Submitting…' : `Submit ranking (${placedCount}/${items.length}) →`}
            </Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textHi, marginHorizontal: spacing.sm },
  hint: { textAlign: 'center', fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textLow, marginBottom: spacing.sm },
  body: { paddingHorizontal: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  tierRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'stretch' },
  badge: { width: 44, minHeight: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.display, fontSize: 20, color: '#0A0A0F' },
  slot: { flex: 1, minHeight: 64, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  slotArmed: { borderColor: withAlpha(colors.brandA, 0.5), borderStyle: 'dashed' },
  tile: { borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  tileOn: { borderColor: colors.brandA },
  trayHead: { marginTop: spacing.md, marginBottom: spacing.xs },
  trayLabel: { fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.2, color: colors.textLow },
  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 64, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  trayEmpty: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, padding: spacing.sm },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, alignItems: 'center', backgroundColor: 'rgba(7,7,11,0.92)', borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  submitBtn: { height: 52, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', width: '100%' },
  submitText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
  bigGlyph: { fontSize: 42 },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi },
  retry: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  retryText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
});
