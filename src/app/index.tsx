import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { SlidingListsBackdrop } from '@/components/SlidingListsBackdrop';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { heroArtFor, itemNamesOf, premadeLists } from '@/data/premade';
import type { PremadeList } from '@/data/premade/types';
import type { Category, TierList } from '@/data/types';
import { Avatar } from '@/components/Avatar';
import { fetchMyProfile, type Profile } from '@/data/community';
import { isCommunityEnabled } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { FAB } from '@/features/home/FAB';
import { GridListCard, type Strip } from '@/features/home/GridListCard';
import { useListsStore } from '@/store/useListsStore';
import { CONTENT_MAX_WIDTH, useLayout } from '@/theme/layout';
import { CATEGORY_ACCENTS, withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';
import { rankByQuery } from '@/utils/search';

const CAT_GLYPH: Record<Category, string> = {
  games: '🎮',
  movies: '🎬',
  food: '🍜',
  music: '🎧',
  books: '📚',
  anime: '🌸',
  sports: '🏆',
  anything: '🌐',
};
const CAT_LABEL: Record<Category, string> = {
  games: 'Games',
  movies: 'Movies & TV',
  food: 'Food & Drinks',
  music: 'Music',
  books: 'Books',
  anime: 'Anime',
  sports: 'Athletes',
  anything: 'Everything',
};

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(ts).toLocaleDateString();
}

function userHeroUri(list: TierList): string | null {
  const ids = [...list.tiers.flatMap((t) => t.itemIds), ...list.unrankedIds];
  for (const id of ids) {
    const it = list.items[id];
    if (it?.imageUrl) return it.imageUrl;
  }
  return null;
}

const SHELF_CARD_W = 168;
const SHELF_PREVIEW = 15; // horizontal FlatList virtualizes; this is just the cap

/** One category's lists as a horizontal carousel with a tappable "See all" head. */
function CategoryShelf({
  cat,
  lists,
  gutter,
  onSeeAll,
  onOpen,
}: {
  cat: Category;
  lists: PremadeList[];
  gutter: number;
  onSeeAll: () => void;
  onOpen: (l: PremadeList) => void;
}) {
  if (lists.length === 0) return null;
  const preview = lists.slice(0, SHELF_PREVIEW);
  const overflow = lists.length > SHELF_PREVIEW;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <PressableScale onPress={onSeeAll} style={styles.shelfHead}>
        <Text style={styles.shelfTitle}>
          {CAT_GLYPH[cat]} {CAT_LABEL[cat]}
        </Text>
        <Text style={styles.shelfSeeAll}>{lists.length} · See all →</Text>
      </PressableScale>
      <FlatList
        horizontal
        data={preview}
        keyExtractor={(l) => l.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: gutter, paddingRight: spacing.lg }}
        renderItem={({ item, index }) => {
          const strips: Strip[] = item.tiers.map((t) => ({ color: t.color, weight: t.items.length }));
          const count = item.tiers.reduce((n, t) => n + t.items.length, 0);
          return (
            <GridListCard
              title={item.title}
              subtitle={item.tagline}
              glyph={CAT_GLYPH[item.category]}
              accent={CATEGORY_ACCENTS[item.category]}
              strips={strips}
              badge={`${count} ranked`}
              heroSpec={heroArtFor(item)}
              width={SHELF_CARD_W}
              index={index}
              onPress={() => onOpen(item)}
            />
          );
        }}
        ListFooterComponent={
          overflow ? (
            <PressableScale onPress={onSeeAll} scaleTo={0.96} style={{ width: SHELF_CARD_W }}>
              <View style={styles.seeAllCard}>
                <Text style={styles.seeAllPlus}>→</Text>
                <Text style={styles.seeAllLabel}>See all {lists.length}</Text>
              </View>
            </PressableScale>
          ) : null
        }
      />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const layout = useLayout();

  const lists = useListsStore((s) => s.lists);
  const deleteList = useListsStore((s) => s.deleteList);
  const duplicateList = useListsStore((s) => s.duplicateList);
  const upsertList = useListsStore((s) => s.upsertList);
  const toast = useToast((s) => s.show);

  const communityUser = useAuth((s) => s.user);
  const [homeProfile, setHomeProfile] = useState<Profile | null>(null);
  useEffect(() => {
    if (isCommunityEnabled && communityUser) fetchMyProfile().then(setHomeProfile).catch(() => {});
    else setHomeProfile(null);
  }, [communityUser]);

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [expanded, setExpanded] = useState(false);
  const [sheetFor, setSheetFor] = useState<TierList | null>(null);
  const lastDeleted = useRef<TierList | null>(null);

  // Keep the first screen short: show a page of curated lists, expand on demand.
  const PAGE = 12;

  const userLists = useMemo(
    () => Object.values(lists).sort((a, b) => b.updatedAt - a.updatedAt),
    [lists]
  );

  // Category chips only for categories that actually have curated lists.
  const categories = useMemo(() => {
    const seen: Category[] = [];
    for (const l of premadeLists) if (!seen.includes(l.category)) seen.push(l.category);
    return seen;
  }, []);

  const byCat = <T extends { category: Category }>(arr: T[]) =>
    activeCat === 'all' ? arr : arr.filter((l) => l.category === activeCat);

  const consensus = rankByQuery(query, byCat(premadeLists), (l) => ({
    title: l.title,
    category: CAT_LABEL[l.category],
    tagline: l.tagline,
    itemNames: itemNamesOf(l),
  }));

  // When searching, show every match; otherwise page it (tap "Show all").
  const paged = query.trim().length > 0 || expanded;
  const shownConsensus = paged ? consensus : consensus.slice(0, PAGE);

  // Unfiltered + not searching → browse by category "shelves" (one horizontal
  // carousel per category), so all 238 lists are scannable without an endless
  // vertical scroll. Picking a category or searching switches back to the grid.
  const browsing = activeCat === 'all' && query.trim().length === 0;
  const shelves = useMemo(() => {
    const map = new Map<Category, PremadeList[]>();
    for (const l of premadeLists) {
      const arr = map.get(l.category);
      if (arr) arr.push(l);
      else map.set(l.category, [l]);
    }
    return categories.map((cat) => ({ cat, lists: map.get(cat) ?? [] }));
  }, [categories]);

  const yours = rankByQuery(query, byCat(userLists), (l) => ({
    title: l.title,
    category: CAT_LABEL[l.category],
    itemNames: Object.values(l.items).map((i) => i.name),
  }));

  const surpriseMe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pool = consensus.length ? consensus : premadeLists;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push({ pathname: '/premade/[premadeId]', params: { premadeId: pick.id } });
  };

  const handleDelete = (list: TierList) => {
    lastDeleted.current = list;
    deleteList(list.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    toast(`Deleted "${list.title}"`, {
      actionLabel: 'Undo',
      durationMs: 5000,
      onAction: () => {
        const revived = lastDeleted.current;
        if (revived) {
          upsertList(revived);
          lastDeleted.current = null;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    });
  };

  const gridStyle = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: layout.gutter };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <SlidingListsBackdrop />
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: insets.top + spacing.lg,
          }}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Tier Deck</Text>
              <Text style={styles.tagline}>Rank absolutely everything.</Text>
            </View>
            <PressableScale onPress={surpriseMe} style={styles.dice} accessibilityLabel="Surprise me">
              <Text style={styles.diceText}>🎲</Text>
            </PressableScale>
            {isCommunityEnabled ? (
              <PressableScale
                onPress={() => router.push(communityUser ? '/community/profile' : '/community')}
                style={styles.account}
                accessibilityLabel="Account"
              >
                {communityUser ? (
                  <Avatar url={homeProfile?.avatar_url} name={homeProfile?.display_name} size={44} />
                ) : (
                  <Text style={styles.diceText}>👤</Text>
                )}
              </PressableScale>
            ) : null}
          </View>

          {/* Fuzzy search */}
          <GlassPanel radius={16} style={{ marginBottom: spacing.md }}>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search lists — try 'zelda', 'pizza', 'movies'…"
                placeholderTextColor={colors.textLow}
                style={styles.searchInput}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <PressableScale onPress={() => setQuery('')} hitSlop={10} style={styles.clearBtn}>
                  <Text style={styles.clearText}>✕</Text>
                </PressableScale>
              ) : null}
            </View>
          </GlassPanel>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
            style={{ marginBottom: spacing.lg }}
          >
            {(['all', ...categories] as const).map((section) => {
              const active = activeCat === section;
              const accent = section === 'all' ? colors.brandA : CATEGORY_ACCENTS[section];
              return (
                <PressableScale
                  key={section}
                  onPress={() => {
                    setActiveCat(section);
                    setExpanded(false);
                  }}
                  scaleTo={0.93}
                  style={[
                    styles.chip,
                    active && { backgroundColor: withAlpha(accent, 0.2), borderColor: withAlpha(accent, 0.6) },
                  ]}
                >
                  <Text style={[styles.chipText, active && { color: colors.textHi }]}>
                    {section === 'all' ? '✨ All' : `${CAT_GLYPH[section]} ${CAT_LABEL[section]}`}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          {/* Community — only when the backend is configured */}
          {isCommunityEnabled ? (
            <PressableScale onPress={() => router.push('/community')} style={{ marginBottom: spacing.lg }}>
              <View style={styles.communityBanner}>
                <Text style={styles.communityGlyph}>🌐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.communityTitle}>Community</Text>
                  <Text style={styles.communitySub}>See what everyone's ranking — like & publish</Text>
                </View>
                <Text style={styles.communityArrow}>→</Text>
              </View>
            </PressableScale>
          ) : null}

          {/* The Consensus */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>The Consensus</Text>
            <Text style={styles.sectionSub}>
              {browsing ? `${premadeLists.length} curated · browse by category` : `${consensus.length} curated · tap in for the reasons`}
            </Text>
          </View>

          {browsing ? (
            shelves.map(({ cat, lists: catLists }) => (
              <CategoryShelf
                key={cat}
                cat={cat}
                lists={catLists}
                gutter={layout.gutter}
                onSeeAll={() => {
                  Haptics.selectionAsync();
                  setActiveCat(cat);
                  setExpanded(true);
                }}
                onOpen={(l) => router.push({ pathname: '/premade/[premadeId]', params: { premadeId: l.id } })}
              />
            ))
          ) : consensus.length === 0 ? (
            <Text style={styles.noResults}>No curated lists match “{query}”. Your search might make a great new list — tap +.</Text>
          ) : (
            <>
              <View style={[gridStyle, { marginBottom: spacing.md }]}>
                {shownConsensus.map((list, i) => {
                  const strips: Strip[] = list.tiers.map((t) => ({ color: t.color, weight: t.items.length }));
                  const count = list.tiers.reduce((n, t) => n + t.items.length, 0);
                  return (
                    <GridListCard
                      key={list.id}
                      title={list.title}
                      subtitle={list.tagline}
                      glyph={CAT_GLYPH[list.category]}
                      accent={CATEGORY_ACCENTS[list.category]}
                      strips={strips}
                      badge={`${count} ranked`}
                      heroSpec={heroArtFor(list)}
                      width={layout.cardWidth}
                      index={i}
                      onPress={() =>
                        router.push({ pathname: '/premade/[premadeId]', params: { premadeId: list.id } })
                      }
                    />
                  );
                })}
              </View>

              {!paged && consensus.length > PAGE ? (
                <PressableScale onPress={() => setExpanded(true)} style={styles.showAll}>
                  <Text style={styles.showAllText}>Show all {consensus.length} lists ↓</Text>
                </PressableScale>
              ) : null}
              {paged && !query && consensus.length > PAGE ? (
                <PressableScale onPress={() => setExpanded(false)} style={styles.showAll}>
                  <Text style={styles.showAllText}>Show less ↑</Text>
                </PressableScale>
              ) : null}
            </>
          )}

          <View style={{ height: spacing.xl }} />

          {/* Your Lists — private */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your Lists</Text>
            <Text style={styles.sectionSub}>saved on this device · just for you</Text>
          </View>
          <View style={gridStyle}>
            {/* Create-your-own card always first */}
            <PressableScale
              onPress={() => router.push('/create/category')}
              scaleTo={0.97}
              style={{ width: layout.cardWidth }}
            >
              <View style={styles.createCard}>
                <Text style={styles.createPlus}>＋</Text>
                <Text style={styles.createTitle}>Rank your own</Text>
                <Text style={styles.createSub}>Search anything, build a board, keep it private.</Text>
              </View>
            </PressableScale>

            {yours.map((list, i) => {
              const strips: Strip[] = list.tiers.map((t) => ({ color: t.color, weight: t.itemIds.length }));
              const total = list.tiers.reduce((n, t) => n + t.itemIds.length, 0) + list.unrankedIds.length;
              return (
                <GridListCard
                  key={list.id}
                  title={list.title}
                  subtitle={`${total} item${total === 1 ? '' : 's'} · ${relativeTime(list.updatedAt)}`}
                  glyph={CAT_GLYPH[list.category]}
                  accent={CATEGORY_ACCENTS[list.category]}
                  strips={strips}
                  badge="Yours"
                  heroUri={userHeroUri(list)}
                  width={layout.cardWidth}
                  index={i}
                  onPress={() => router.push(`/board/${list.id}`)}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSheetFor(list);
                  }}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FAB onPress={() => router.push('/create/category')} />

      <ActionSheet
        visible={sheetFor != null}
        title={sheetFor?.title}
        onClose={() => setSheetFor(null)}
        actions={
          sheetFor
            ? [
                {
                  label: 'Duplicate',
                  icon: '📄',
                  onPress: () => {
                    const copy = duplicateList(sheetFor.id);
                    if (copy) toast(`Duplicated as "${copy.title}"`);
                  },
                },
                { label: 'Export as image', icon: '📤', onPress: () => router.push(`/export/${sheetFor.id}`) },
                { label: 'Delete', icon: '🗑️', destructive: true, onPress: () => handleDelete(sheetFor) },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.lg },
  account: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  title: { fontFamily: fonts.display, fontSize: type.display, color: colors.textHi },
  tagline: { fontFamily: fonts.body, fontSize: type.body, color: colors.textMid, marginTop: 4 },
  dice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceText: { fontSize: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.textHi,
    paddingVertical: spacing.md + 2,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: colors.textMid, fontSize: 12 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, color: colors.textMid },
  showAll: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: withAlpha(colors.brandA, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.brandA, 0.35),
  },
  showAllText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: '#B9A5FF',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  shelfHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.panel,
    backgroundColor: withAlpha('#4CC9F0', 0.1),
    borderWidth: 1,
    borderColor: withAlpha('#4CC9F0', 0.35),
  },
  communityGlyph: { fontSize: 26 },
  communityTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi },
  communitySub: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 2 },
  communityArrow: { fontSize: 20, color: '#7FD8F5' },
  shelfTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi },
  shelfSeeAll: { fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, color: '#B9A5FF' },
  seeAllCard: {
    height: 168,
    borderRadius: radii.panel,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.brandA, 0.4),
    borderStyle: 'dashed',
    backgroundColor: withAlpha(colors.brandA, 0.06),
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  seeAllPlus: { fontFamily: fonts.display, fontSize: 30, color: '#B9A5FF' },
  seeAllLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: colors.textHi,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: type.title, color: colors.textHi },
  sectionSub: { fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textLow },
  noResults: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  createCard: {
    height: 168,
    borderRadius: radii.panel,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.brandA, 0.4),
    borderStyle: 'dashed',
    backgroundColor: withAlpha(colors.brandA, 0.06),
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  createPlus: { fontFamily: fonts.display, fontSize: 34, color: '#B9A5FF' },
  createTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
    marginTop: spacing.xs,
  },
  createSub: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: 4,
  },
});
