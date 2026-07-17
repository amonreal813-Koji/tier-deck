import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { fetchPublished, reportList, setLike, type PublishedList } from '@/data/community';
import { useAuth } from '@/store/useAuth';
import { useListsStore } from '@/store/useListsStore';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

export default function CommunityListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signInWithGoogle);
  const importList = useListsStore((s) => s.importList);

  const [list, setList] = useState<PublishedList | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!id) return;
    fetchPublished(id)
      .then((l) => {
        setList(l);
        setStatus(l ? 'ready' : 'error');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  const toggleLike = async () => {
    if (!list) return;
    if (!user) {
      toast('Sign in to like.');
      signIn();
      return;
    }
    const next = !list.liked;
    Haptics.selectionAsync();
    setList({ ...list, liked: next, like_count: list.like_count + (next ? 1 : -1) });
    try {
      await setLike(list.id, next);
    } catch {
      setList({ ...list, liked: !next, like_count: list.like_count + (next ? -1 : 1) });
      toast('Could not update like.');
    }
  };

  const makeItYours = () => {
    if (!list) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const forked = importList(list.title, list.category, list.tiers);
    router.replace(`/board/${forked.id}`);
  };

  const report = async () => {
    if (!list) return;
    try {
      await reportList(list.id, 'Reported from list view');
      toast('Thanks — this list was flagged for review.');
    } catch {
      toast('Could not send the report.');
    }
  };

  if (status === 'loading') {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.note}>Loading…</Text>
      </View>
    );
  }
  if (status === 'error' || !list) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.bigGlyph}>🤷</Text>
        <Text style={styles.emptyTitle}>This list isn’t available</Text>
        <PressableScale onPress={() => router.back()} style={styles.retry}>
          <Text style={styles.retryText}>Go back</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <PressableScale onPress={report} hitSlop={8} style={styles.reportBtn}>
          <Text style={styles.reportText}>Report</Text>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={styles.title}>{list.title}</Text>
          <Text style={styles.meta}>
            by {list.author?.display_name || 'a ranker'} · {list.like_count} {list.like_count === 1 ? 'like' : 'likes'}
          </Text>
          {list.tagline ? <Text style={styles.tagline}>{list.tagline}</Text> : null}

          {list.tiers.map((tier, i) => (
            <View key={i} style={styles.tierRow}>
              <View style={[styles.badge, { backgroundColor: tier.color }]}>
                <Text style={styles.badgeText} numberOfLines={1}>{tier.label}</Text>
              </View>
              <View style={styles.items}>
                {tier.items.length === 0 ? (
                  <View style={{ height: 52 }} />
                ) : (
                  tier.items.map((it) => (
                    <View key={it.id} style={styles.itemCell}>
                      <ItemThumb item={it} size={52} radius={10} />
                    </View>
                  ))
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PressableScale onPress={toggleLike} style={[styles.likeBtn, list.liked && styles.likeBtnOn]}>
          <Text style={[styles.likeGlyph, list.liked && { color: '#FF3B6B' }]}>{list.liked ? '♥' : '♡'}</Text>
          <Text style={styles.likeCount}>{list.like_count}</Text>
        </PressableScale>
        <PressableScale onPress={makeItYours} style={{ flex: 1 }}>
          <LinearGradient
            colors={[colors.brandA, colors.brandB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.forkBtn}
          >
            <Text style={styles.forkText}>Make it yours →</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  reportBtn: { paddingHorizontal: spacing.md, paddingVertical: 8 },
  reportText: { fontFamily: fonts.bodyMedium, fontSize: type.micro + 1, color: colors.textLow },
  body: { paddingHorizontal: spacing.lg, width: '100%', maxWidth: 820, alignSelf: 'center' },
  title: { fontFamily: fonts.display, fontSize: type.title, color: colors.textHi },
  meta: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 4 },
  tagline: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 10, marginBottom: 6 },
  tierRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-start' },
  badge: {
    width: 46, minHeight: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.display, fontSize: 18, color: '#0A0A0F' },
  items: {
    flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  itemCell: { width: 52 },
  actions: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: 'rgba(7,7,11,0.9)',
    borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
  },
  likeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, height: 52,
    borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  likeBtnOn: { borderColor: 'rgba(255,59,107,0.5)' },
  likeGlyph: { fontSize: 22, color: colors.textMid },
  likeCount: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textHi },
  forkBtn: {
    height: 52, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  forkText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
  bigGlyph: { fontSize: 42 },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi },
  note: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid },
  retry: {
    marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  retryText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
});
