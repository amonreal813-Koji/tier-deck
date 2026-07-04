import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import type { Tier, TierItem } from '@/data/types';
import { DragProvider, useDrag } from '@/features/board/drag/DragContext';
import { TierRow } from '@/features/board/TierRow';
import { TierSettingsSheet } from '@/features/board/TierSettingsSheet';
import { UnrankedTray } from '@/features/board/UnrankedTray';
import { UNRANKED_ZONE, useEditorStore } from '@/store/useEditorStore';
import { useListsStore } from '@/store/useListsStore';
import { colors, fonts, spacing, type } from '@/theme/tokens';

/** Pulses green for a beat every time a save lands. */
function SavedDot() {
  const nonce = useEditorStore((s) => s.saveNonce);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (nonce > 0) {
      glow.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 900 }));
    }
  }, [nonce, glow]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.65,
    transform: [{ scale: 1 + glow.value * 0.4 }],
  }));

  return <Animated.View style={[styles.savedDot, style]} />;
}

/** Appears while an item is tap-selected: quick route to unranked/removal. */
function SelectionBar() {
  const selectedItemId = useEditorStore((s) => s.selectedItemId);
  const list = useEditorStore((s) => s.list);
  const moveItem = useEditorStore((s) => s.moveItem);
  const removeItem = useEditorStore((s) => s.removeItem);
  const select = useEditorStore((s) => s.select);

  if (!selectedItemId || !list) return null;
  const item = list.items[selectedItemId];
  if (!item) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(200)}
      exiting={FadeOutUp.duration(150)}
      style={styles.selectionBar}
    >
      <Text style={styles.selectionName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.selectionHint}>tap a tier ↓</Text>
      <PressableScale
        onPress={() => moveItem(selectedItemId, UNRANKED_ZONE)}
        style={styles.selectionBtn}
        hitSlop={6}
      >
        <Text style={styles.selectionBtnText}>↩ Unrank</Text>
      </PressableScale>
      <PressableScale
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeItem(selectedItemId);
        }}
        style={[styles.selectionBtn, styles.selectionBtnDanger]}
        hitSlop={6}
      >
        <Text style={[styles.selectionBtnText, { color: colors.danger }]}>✕</Text>
      </PressableScale>
      <PressableScale onPress={() => select(null)} style={styles.selectionBtn} hitSlop={6}>
        <Text style={styles.selectionBtnText}>Done</Text>
      </PressableScale>
    </Animated.View>
  );
}

function BoardBody() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const drag = useDrag();

  const list = useEditorStore((s) => s.list)!;
  const select = useEditorStore((s) => s.select);
  const selectedItemId = useEditorStore((s) => s.selectedItemId);
  const moveItem = useEditorStore((s) => s.moveItem);

  const [settingsTier, setSettingsTier] = useState<Tier | null>(null);

  const placing = selectedItemId != null;
  const dragging = drag.draggingItem != null;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    drag.scrollY.value = e.contentOffset.y;
  });

  const measureBoard = (e: LayoutChangeEvent) => {
    // The scroll viewport's window-space band, for hit tests + auto-scroll.
    e.currentTarget.measureInWindow((_x, y, _w, h) => {
      if (typeof y === 'number' && h > 0) {
        drag.boardTop.value = y;
        drag.boardBottom.value = y + h;
      }
    });
  };

  const handleItemTap = (item: TierItem) => {
    Haptics.selectionAsync();
    select(selectedItemId === item.id ? null : item.id);
  };

  const handleChipTap = (tier: Tier) => {
    if (placing && selectedItemId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      moveItem(selectedItemId, tier.id);
    }
  };

  return (
    <>
      <SelectionBar />
      <Animated.ScrollView
        ref={drag.scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollEnabled={!dragging}
        onLayout={measureBoard}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {list.tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            items={tier.itemIds.map((id) => list.items[id]).filter(Boolean)}
            placing={placing}
            selectedItemId={selectedItemId}
            onChipTap={() => handleChipTap(tier)}
            onChipLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSettingsTier(tier);
            }}
            onItemTap={handleItemTap}
          />
        ))}
      </Animated.ScrollView>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.sm }}>
        <UnrankedTray
          items={list.unrankedIds.map((id) => list.items[id]).filter(Boolean)}
          placing={placing}
          selectedItemId={selectedItemId}
          onZoneTap={() => {
            if (selectedItemId) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              moveItem(selectedItemId, UNRANKED_ZONE);
            }
          }}
          onItemTap={handleItemTap}
          onAddItems={() =>
            router.push({
              pathname: '/create/search',
              params: { category: list.category, appendTo: list.id },
            })
          }
        />
      </View>

      <TierSettingsSheet tier={settingsTier} onClose={() => setSettingsTier(null)} />
    </>
  );
}

export default function BoardScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);

  const sourceList = useListsStore((s) => (listId ? s.lists[listId] : undefined));
  const deleteList = useListsStore((s) => s.deleteList);

  const list = useEditorStore((s) => s.list);
  const open = useEditorStore((s) => s.open);
  const close = useEditorStore((s) => s.close);
  const setTitle = useEditorStore((s) => s.setTitle);
  const addTier = useEditorStore((s) => s.addTier);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Open the editor session once the source list is available.
  useEffect(() => {
    if (sourceList && (!list || list.id !== sourceList.id)) {
      open(sourceList);
      setTitleDraft(sourceList.title);
    }
  }, [sourceList, list, open]);

  // New items appended from the search screen while this board was open.
  useEffect(() => {
    if (list && sourceList && list.id === sourceList.id) {
      const known = Object.keys(list.items).length;
      const incoming = Object.keys(sourceList.items).length;
      if (incoming > known) {
        open(sourceList);
      }
    }
  }, [sourceList, list, open]);

  useEffect(() => () => close(), [close]);

  if (!list) {
    return (
      <View style={styles.root}>
        <AnimatedGradientBg />
      </View>
    );
  }

  const handleDeleteList = () => {
    deleteList(list.id);
    close();
    router.back();
    toast(`Deleted "${list.title}"`);
  };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Text style={styles.iconText}>←</Text>
        </PressableScale>

        <View style={styles.titleWrap}>
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            onBlur={() => {
              const trimmed = titleDraft.trim();
              if (trimmed) setTitle(trimmed);
              else setTitleDraft(list.title);
            }}
            style={styles.titleInput}
            numberOfLines={1}
          />
          <SavedDot />
        </View>

        <PressableScale
          onPress={undo}
          style={[styles.iconBtn, !canUndo && styles.iconBtnDisabled]}
          hitSlop={8}
          disabled={!canUndo}
        >
          <Text style={styles.iconText}>↩</Text>
        </PressableScale>
        <PressableScale
          onPress={redo}
          style={[styles.iconBtn, !canRedo && styles.iconBtnDisabled]}
          hitSlop={8}
          disabled={!canRedo}
        >
          <Text style={styles.iconText}>↪</Text>
        </PressableScale>
        <PressableScale onPress={() => setMenuOpen(true)} style={styles.iconBtn} hitSlop={8}>
          <Text style={styles.iconText}>⋯</Text>
        </PressableScale>
      </View>

      <DragProvider>
        <BoardBody />
      </DragProvider>

      <ActionSheet
        visible={menuOpen}
        title={list.title}
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            label: 'Add items',
            icon: '🔍',
            onPress: () =>
              router.push({
                pathname: '/create/search',
                params: { category: list.category, appendTo: list.id },
              }),
          },
          { label: 'Add tier', icon: '➕', onPress: addTier },
          {
            label: 'Export as image',
            icon: '📤',
            onPress: () => router.push(`/export/${list.id}`),
          },
          { label: 'Delete list', icon: '🗑️', destructive: true, onPress: handleDeleteList },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
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
  iconBtnDisabled: { opacity: 0.35 },
  iconText: { color: colors.textHi, fontSize: 16 },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleInput: {
    flex: 1,
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
    paddingVertical: 6,
  },
  savedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(124,92,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)',
  },
  selectionName: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: colors.textHi,
  },
  selectionHint: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textMid,
  },
  selectionBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  selectionBtnDanger: {
    backgroundColor: 'rgba(255,77,109,0.10)',
    borderColor: 'rgba(255,77,109,0.35)',
  },
  selectionBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro + 1,
    color: colors.textHi,
  },
});
