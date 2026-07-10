import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { backdropEntering, backdropExiting, backdropFixed, sheetEntering, sheetExiting } from '@/theme/motion';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { GlassPanel } from '@/components/GlassPanel';
import { GlowBadge } from '@/components/GlowBadge';
import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { resolveArtBatch } from '@/data/premade/art';
import { getPremadeList } from '@/data/premade';
import type { PremadeItem, PremadeTier } from '@/data/premade/types';
import type { TierItem } from '@/data/types';
import { useListsStore } from '@/store/useListsStore';
import { applyArrangement, usePremadeEdits } from '@/store/usePremadeEdits';
import { withAlpha } from '@/theme/tierColors';
import { CONTENT_MAX_WIDTH } from '@/theme/layout';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';
import { isShoppable, shopUrl } from '@/utils/affiliate';

interface Selection {
  item: PremadeItem;
  tier: PremadeTier;
}

export default function PremadeScreen() {
  const { premadeId } = useLocalSearchParams<{ premadeId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const importList = useListsStore((s) => s.importList);

  const list = premadeId ? getPremadeList(premadeId) : undefined;
  const [art, setArt] = useState<Record<string, string | null>>({});
  const [selection, setSelection] = useState<Selection | null>(null);
  const [view, setView] = useState<'board' | 'reasons'>('board');
  const [editing, setEditing] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const override = usePremadeEdits((s) => (premadeId ? s.overrides[premadeId] : undefined));
  const setArrangement = usePremadeEdits((s) => s.setArrangement);
  const resetEdits = usePremadeEdits((s) => s.reset);

  // The curated order with the user's saved moves applied.
  const displayTiers = useMemo(
    () => (list ? applyArrangement(list.tiers, override) : []),
    [list, override]
  );

  const allItems = useMemo(
    () => (list ? list.tiers.flatMap((t) => t.items.map((i) => ({ id: i.id, art: i.art }))) : []),
    [list]
  );

  useEffect(() => {
    let alive = true;
    resolveArtBatch(allItems, (id, url) => {
      if (alive) setArt((a) => ({ ...a, [id]: url }));
    });
    return () => {
      alive = false;
    };
  }, [allItems]);

  if (!list) {
    return (
      <View style={styles.root}>
        <AnimatedGradientBg />
      </View>
    );
  }

  const toTierItem = (item: PremadeItem): TierItem => ({
    id: `${list.id}:${item.id}`,
    name: item.name,
    imageUrl: art[item.id] ?? null,
    subtitle: item.subtitle,
    category: list.category,
  });

  const handleMakeItYours = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const created = importList(
      list.title,
      list.category,
      displayTiers.map((t) => ({ label: t.label, color: t.color, items: t.items.map(toTierItem) }))
    );
    toast('Copied — now make it wrong 😄');
    router.replace(`/board/${created.id}`);
  };

  // Move an item to another tier and persist it against this curated list.
  const moveItem = (itemId: string, toLabel: string) => {
    const arrangement: Record<string, string[]> = {};
    for (const t of displayTiers) arrangement[t.label] = t.items.map((i) => i.id).filter((id) => id !== itemId);
    arrangement[toLabel] = [...(arrangement[toLabel] ?? []), itemId];
    setArrangement(list.id, arrangement);
    Haptics.selectionAsync();
    setMovingId(null);
  };

  const toggleEditing = () => {
    Haptics.selectionAsync();
    setMovingId(null);
    setView('board');
    setEditing((e) => !e);
  };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Text style={styles.iconText}>←</Text>
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {list.title}
          </Text>
          <Text style={styles.tapHint}>
            {view === 'board' ? 'tap any item for the why' : 'every placement, explained'}
          </Text>
        </View>
        {!editing ? (
          <View style={styles.viewToggle}>
            {(['board', 'reasons'] as const).map((v) => (
              <PressableScale
                key={v}
                onPress={() => setView(v)}
                scaleTo={0.94}
                style={[styles.togglePill, view === v && styles.togglePillActive]}
              >
                <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                  {v === 'board' ? 'Board' : 'Why?'}
                </Text>
              </PressableScale>
            ))}
          </View>
        ) : null}
        <PressableScale
          onPress={toggleEditing}
          scaleTo={0.94}
          style={[styles.editPill, editing && styles.editPillActive]}
        >
          <Text style={[styles.editPillText, editing && styles.editPillTextActive]}>
            {editing ? 'Done' : 'Edit'}
          </Text>
        </PressableScale>
      </View>

      {editing ? (
        <View style={styles.editBar}>
          <Text style={styles.editHint} numberOfLines={1}>
            {movingId ? 'Now tap a tier letter to drop it' : 'Tap an item, then a tier letter to move it'}
          </Text>
          {override ? (
            <PressableScale
              onPress={() => {
                resetEdits(list.id);
                setMovingId(null);
                toast('Restored the original order');
              }}
              hitSlop={8}
            >
              <Text style={styles.resetText}>Reset</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 130,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <GlassPanel style={{ marginBottom: spacing.lg }}>
            <View style={styles.basisInner}>
              <Text style={styles.basisLabel}>WHY THESE PLACEMENTS?</Text>
              <Text style={styles.basisText}>{list.basis}</Text>
            </View>
          </GlassPanel>
        </Animated.View>

        {view === 'board'
          ? displayTiers.map((tier, ti) => (
              <Animated.View
                key={tier.label}
                entering={FadeInDown.delay(60 + ti * 50).springify()}
                style={styles.row}
              >
                <PressableScale
                  onPress={() => {
                    if (editing && movingId) moveItem(movingId, tier.label);
                  }}
                  disabled={!editing || !movingId}
                  scaleTo={editing && movingId ? 0.9 : 1}
                  accessibilityLabel={`Tier ${tier.label}`}
                  accessibilityHint={editing && movingId ? 'Move the selected item here' : undefined}
                >
                  <View style={editing && movingId ? styles.badgeDrop : undefined}>
                    <GlowBadge label={tier.label} color={tier.color} size={56} />
                  </View>
                </PressableScale>
                <View style={styles.itemsArea}>
                  <View style={styles.itemsWrap}>
                    {tier.items.map((item) => {
                      const picked = editing && movingId === item.id;
                      return (
                        <PressableScale
                          key={item.id}
                          onPress={() =>
                            editing
                              ? setMovingId((cur) => (cur === item.id ? null : item.id))
                              : setSelection({ item, tier })
                          }
                          scaleTo={0.92}
                          accessibilityLabel={item.name}
                          accessibilityHint={
                            editing ? 'Select, then tap a tier to move it' : "Shows why it's ranked here"
                          }
                        >
                          <View style={[styles.thumbFrame, picked && styles.thumbFramePicked]}>
                            <ItemThumb item={toTierItem(item)} size={64} radius={11} />
                          </View>
                        </PressableScale>
                      );
                    })}
                    {tier.items.length === 0 ? (
                      <Text style={styles.emptyTier}>
                        {editing && movingId ? 'tap the letter →' : 'empty'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Animated.View>
            ))
          : displayTiers.map((tier, ti) => (
              <Animated.View key={tier.label} entering={FadeInDown.delay(40 + ti * 40).springify()}>
                <View style={styles.reasonTierHeader}>
                  <GlowBadge label={tier.label} color={tier.color} size={40} glowOpacity={0.35} />
                  <View style={[styles.reasonTierLine, { backgroundColor: withAlpha(tier.color, 0.35) }]} />
                </View>
                {tier.items.map((item) => (
                  <GlassPanel key={item.id} radius={18} style={styles.reasonCard}>
                    <View style={styles.reasonCardInner}>
                      <View style={styles.reasonCardTop}>
                        <ItemThumb item={toTierItem(item)} size={52} radius={10} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reasonName}>{item.name}</Text>
                          {item.subtitle ? (
                            <Text style={styles.reasonSub}>{item.subtitle}</Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.reasonText}>{item.reasoning}</Text>
                    </View>
                  </GlassPanel>
                ))}
              </Animated.View>
            ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PressableScale onPress={handleMakeItYours} style={{ width: '100%', maxWidth: 520 }}>
          <LinearGradient
            colors={[colors.brandA, colors.brandB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>Disagree? Make it yours</Text>
          </LinearGradient>
        </PressableScale>
      </View>

      <ReasoningSheet
        selection={selection}
        listBasis={list.basis}
        listId={list.id}
        art={selection ? (art[selection.item.id] ?? null) : null}
        category={list.category}
        onClose={() => setSelection(null)}
      />
    </View>
  );
}

function ReasoningSheet({
  selection,
  listBasis,
  listId,
  art,
  category,
  onClose,
}: {
  selection: Selection | null;
  listBasis: string;
  listId: string;
  art: string | null;
  category: TierItem['category'];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!selection) return null;
  const { item, tier } = selection;
  const shoppable = isShoppable(listId);

  const openShop = () => {
    Haptics.selectionAsync();
    Linking.openURL(shopUrl(item.name, listId)).catch(() => {});
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={backdropEntering} exiting={backdropExiting} style={[styles.backdrop, backdropFixed]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={sheetEntering}
          exiting={sheetExiting}
          style={{ marginHorizontal: spacing.md, marginBottom: insets.bottom + spacing.md }}
        >
          <GlassPanel radius={24} tint={withAlpha(tier.color, 0.05)}>
            <View style={styles.sheetInner}>
              <View style={styles.grabber} />
              <View style={styles.sheetHeader}>
                <ItemThumb
                  item={{ id: item.id, name: item.name, imageUrl: art, category }}
                  size={72}
                  radius={14}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{item.name}</Text>
                  {item.subtitle ? <Text style={styles.sheetSub}>{item.subtitle}</Text> : null}
                  <View style={[styles.tierPill, { backgroundColor: withAlpha(tier.color, 0.18), borderColor: withAlpha(tier.color, 0.55) }]}>
                    <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.label} TIER</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reasoning}>{item.reasoning}</Text>
              {shoppable ? (
                <PressableScale onPress={openShop} style={{ marginTop: spacing.md }}>
                  <LinearGradient
                    colors={[withAlpha(tier.color, 0.9), withAlpha(tier.color, 0.55)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shopBtn}
                  >
                    <Text style={styles.shopText}>Shop {item.name}</Text>
                    <Text style={styles.shopArrow}>↗</Text>
                  </LinearGradient>
                </PressableScale>
              ) : null}
              {shoppable ? <Text style={styles.shopDisclosure}>We may earn from qualifying purchases.</Text> : null}
              <Text style={styles.basisFootnote}>{listBasis}</Text>
            </View>
          </GlassPanel>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.textHi, fontSize: 16 },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
  },
  tapHint: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textLow,
    marginTop: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
  },
  togglePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
  togglePillActive: {
    backgroundColor: withAlpha('#7C5CFF', 0.28),
    borderWidth: 1,
    borderColor: withAlpha('#7C5CFF', 0.55),
  },
  toggleText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro + 1,
    color: colors.textMid,
  },
  toggleTextActive: {
    color: colors.textHi,
  },
  editPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  editPillActive: {
    backgroundColor: withAlpha('#4ADE80', 0.2),
    borderColor: withAlpha('#4ADE80', 0.6),
  },
  editPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro + 1,
    color: colors.textMid,
  },
  editPillTextActive: {
    color: '#8BF0B0',
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: withAlpha('#4ADE80', 0.1),
    borderWidth: 1,
    borderColor: withAlpha('#4ADE80', 0.3),
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  editHint: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.textMid,
  },
  resetText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: '#8BF0B0',
  },
  badgeDrop: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: withAlpha('#4ADE80', 0.8),
  },
  thumbFramePicked: {
    borderColor: '#4ADE80',
    borderWidth: 2,
  },
  emptyTier: {
    fontFamily: fonts.body,
    fontSize: type.micro + 1,
    color: colors.textLow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  reasonTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  reasonTierLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  reasonCard: {
    marginBottom: spacing.sm + 2,
  },
  reasonCardInner: {
    padding: spacing.md + 2,
  },
  reasonCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  reasonName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: colors.textHi,
  },
  reasonSub: {
    fontFamily: fonts.body,
    fontSize: type.micro + 1,
    color: colors.textLow,
    marginTop: 1,
  },
  reasonText: {
    fontFamily: fonts.body,
    fontSize: type.caption + 1,
    color: colors.textMid,
    lineHeight: 21,
  },
  basisInner: {
    padding: spacing.lg,
  },
  basisLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro,
    letterSpacing: 1.4,
    color: colors.textLow,
    marginBottom: spacing.xs + 2,
  },
  basisText: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemsArea: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.xs,
    justifyContent: 'center',
  },
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    padding: 2,
  },
  thumbFrame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  ctaBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: '#FFF',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4,4,8,0.6)',
  },
  sheetInner: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetName: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
  },
  sheetSub: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    marginTop: 2,
  },
  tierPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro,
    letterSpacing: 1,
  },
  reasoning: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.textHi,
    lineHeight: 23,
  },
  basisFootnote: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textLow,
    marginTop: spacing.md,
    lineHeight: 16,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  shopText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: '#0A0A0F',
  },
  shopArrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: '#0A0A0F',
  },
  shopDisclosure: {
    fontFamily: fonts.body,
    fontSize: type.micro - 1,
    color: colors.textLow,
    marginTop: spacing.xs + 1,
    textAlign: 'center',
  },
});
