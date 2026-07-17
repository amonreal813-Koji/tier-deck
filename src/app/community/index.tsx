import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { Avatar } from '@/components/Avatar';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { fetchFeed, fetchMyProfile, setLike, type FeedSort, type Profile, type PublishedList } from '@/data/community';
import { isCommunityEnabled } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

function PublishedCard({
  item,
  onOpen,
  onToggleLike,
  index,
}: {
  item: PublishedList;
  onOpen: () => void;
  onToggleLike: () => void;
  index: number;
}) {
  const strip = item.tiers.slice(0, 6);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify()}>
      <PressableScale onPress={onOpen} style={{ marginBottom: spacing.md }}>
        <GlassPanel radius={16}>
          <View style={styles.cardStrip}>
            {strip.map((t, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: t.color }} />
            ))}
          </View>
          <View style={styles.cardBody}>
            <Avatar url={item.author?.avatar_url} name={item.author?.display_name} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                by {item.author?.display_name || 'a ranker'}
              </Text>
            </View>
            <PressableScale onPress={onToggleLike} hitSlop={10} style={styles.likeBtn}>
              <Text style={[styles.likeGlyph, item.liked && styles.likeGlyphOn]}>
                {item.liked ? '♥' : '♡'}
              </Text>
              <Text style={styles.likeCount}>{item.like_count}</Text>
            </PressableScale>
          </View>
        </GlassPanel>
      </PressableScale>
    </Animated.View>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signInWithGoogle);

  const [sort, setSort] = useState<FeedSort>('hot');
  const [feed, setFeed] = useState<PublishedList[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  // Home is a reliable destination even when there's no history to pop
  // (e.g. landing here straight from the OAuth redirect).
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  useEffect(() => {
    if (user) fetchMyProfile().then(setMyProfile).catch(() => {});
    else setMyProfile(null);
  }, [user]);

  const load = useCallback(
    async (which: FeedSort) => {
      setStatus('loading');
      try {
        setFeed(await fetchFeed(which, { limit: 30 }));
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    },
    []
  );

  useEffect(() => {
    if (isCommunityEnabled) load(sort);
  }, [sort, load, user]);

  const toggleLike = async (item: PublishedList) => {
    if (!user) {
      toast('Sign in to like lists.');
      signIn();
      return;
    }
    const next = !item.liked;
    Haptics.selectionAsync();
    // Optimistic update.
    setFeed((f) =>
      f.map((l) => (l.id === item.id ? { ...l, liked: next, like_count: l.like_count + (next ? 1 : -1) } : l))
    );
    try {
      await setLike(item.id, next);
    } catch {
      // Revert on failure.
      setFeed((f) =>
        f.map((l) => (l.id === item.id ? { ...l, liked: !next, like_count: l.like_count + (next ? -1 : 1) } : l))
      );
      toast('Could not update like. Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.topRow}>
          <PressableScale onPress={goBack} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>←</Text>
          </PressableScale>
          <Text style={styles.kicker}>Community</Text>
          {user ? (
            <PressableScale onPress={() => router.push('/community/profile')} hitSlop={8}>
              <Avatar url={myProfile?.avatar_url} name={myProfile?.display_name} size={36} />
            </PressableScale>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <Text style={styles.title}>What the internet ranked</Text>

        {/* Hot / New */}
        <View style={styles.toggle}>
          {(['hot', 'new'] as const).map((s) => {
            const active = sort === s;
            return (
              <PressableScale key={s} onPress={() => setSort(s)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && { color: colors.textHi }]}>
                  {s === 'hot' ? '🔥 Hot' : '🆕 New'}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {!user ? (
          <PressableScale onPress={() => signIn()} style={{ marginBottom: spacing.md }}>
            <View style={styles.signInBanner}>
              <Text style={styles.signInText}>Sign in with Google to like & publish →</Text>
            </View>
          </PressableScale>
        ) : null}

        <View style={{ flex: 1 }}>
          {status === 'loading' ? (
            <Text style={styles.note}>Loading the feed…</Text>
          ) : status === 'error' ? (
            <Animated.View entering={FadeIn} style={styles.center}>
              <Text style={styles.bigGlyph}>📡</Text>
              <Text style={styles.emptyTitle}>Couldn’t load the community</Text>
              <PressableScale onPress={() => load(sort)} style={styles.retry}>
                <Text style={styles.retryText}>Try again</Text>
              </PressableScale>
            </Animated.View>
          ) : feed.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.center}>
              <Text style={styles.bigGlyph}>🌱</Text>
              <Text style={styles.emptyTitle}>No community lists yet</Text>
              <Text style={styles.note}>Publish one of your boards (⋯ → Publish) and be the first.</Text>
            </Animated.View>
          ) : (
            <FlatList
              data={feed}
              keyExtractor={(l) => l.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
              renderItem={({ item, index }) => (
                <PublishedCard
                  item={item}
                  index={index}
                  onOpen={() => router.push(`/community/${item.id}`)}
                  onToggleLike={() => toggleLike(item)}
                />
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg, width: '100%', maxWidth: 820, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: {
    flex: 1, fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.4,
    textTransform: 'uppercase', color: colors.textLow,
  },
  signOut: { paddingHorizontal: spacing.sm, paddingVertical: 6 },
  signOutText: { fontFamily: fonts.bodyMedium, fontSize: type.micro + 1, color: colors.textLow },
  title: { fontFamily: fonts.display, fontSize: type.title, color: colors.textHi, marginBottom: spacing.md },
  toggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 3, borderRadius: radii.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  tabActive: { backgroundColor: withAlpha('#7C5CFF', 0.22), borderColor: withAlpha('#7C5CFF', 0.6) },
  tabText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textMid },
  signInBanner: {
    padding: spacing.md, borderRadius: radii.card, backgroundColor: withAlpha('#7C5CFF', 0.14),
    borderWidth: 1, borderColor: withAlpha('#7C5CFF', 0.4),
  },
  signInText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#C9BBFF', textAlign: 'center' },
  cardStrip: { flexDirection: 'row', height: 6, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  cardMeta: { fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textLow, marginTop: 2 },
  likeBtn: { alignItems: 'center', minWidth: 44 },
  likeGlyph: { fontSize: 22, color: colors.textLow, lineHeight: 26 },
  likeGlyphOn: { color: '#FF3B6B' },
  likeCount: { fontFamily: fonts.bodySemiBold, fontSize: type.micro, color: colors.textMid },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100, gap: 6 },
  bigGlyph: { fontSize: 42, marginBottom: spacing.sm },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi, textAlign: 'center' },
  note: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, textAlign: 'center', marginTop: 16 },
  retry: {
    marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  retryText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
});
