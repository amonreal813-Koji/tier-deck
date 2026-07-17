import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
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
import { ConfettiBurst } from '@/components/Confetti';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { publishList } from '@/data/community';
import type { Tier, TierItem } from '@/data/types';
import { isCommunityEnabled } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { DragProvider, useDrag } from '@/features/board/drag/DragContext';
import { TierRow } from '@/features/board/TierRow';
import { TierSettingsSheet } from '@/features/board/TierSettingsSheet';
import { UnrankedTray } from '@/features/board/UnrankedTray';
import { UNRANKED_ZONE, useEditorStore } from '@/store/useEditorStore';
import { useListsStore } from '@/store/useListsStore';
import { CONTENT_MAX_WIDTH } from '@/theme/layout';
import { colors, fonts, spacing, type } from '@/theme/tokens';
import { fuzzyScore } from '@/utils/search';

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

/** Appears while an item is tap-selected: reorder, unrank, remove, place. */
function SelectionBar() {
  const selectedItemId = useEditorStore((s) => s.selectedItemId);
  const list = useEditorStore((s) => s.list);
  const moveItem = useEditorStore((s) => s.moveItem);
  const moveWithinZone = useEditorStore((s) => s.moveWithinZone);
  const removeItem = useEditorStore((s) => s.removeItem);
  const select = useEditorStore((s) => s.select);

  if (!selectedItemId || !list) return null;
  const item = list.items[selectedItemId];
  if (!item) return null;

  const nudge = (dir: -1 | 1) => {
    Haptics.selectionAsync();
    moveWithinZone(selectedItemId, dir);
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(200)}
      exiting={FadeOutUp.duration(150)}
      style={styles.selectionBar}
    >
      <Text style={styles.selectionName} numberOfLines={1}>
        {item.name}
      </Text>
      <PressableScale onPress={() => nudge(-1)} style={styles.selectionBtn} hitSlop={6} accessibilityLabel="Move left">
        <Text style={styles.selectionBtnText}>◀</Text>
      </PressableScale>
      <PressableScale onPress={() => nudge(1)} style={styles.selectionBtn} hitSlop={6} accessibilityLabel="Move right">
        <Text style={styles.selectionBtnText}>▶</Text>
      </PressableScale>
      <PressableScale
        onPress={() => moveItem(selectedItemId, UNRANKED_ZONE)}
        style={styles.selectionBtn}
        hitSlop={6}
      >
        <Text style={styles.selectionBtnText}>↩</Text>
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
  const [boardQuery, setBoardQuery] = useState('');
  const [celebrateNonce, setCelebrateNonce] = useState(0);
  const toast = useToast((s) => s.show);

  const totalItems = Object.keys(list.items).length;
  const unrankedCount = list.unrankedIds.length;

  // Celebrate the moment the last unranked item finds a home: everything is
  // now placed. Fire once per empty→ transition (a ref guards re-fires when the
  // list re-renders for other reasons).
  const wasComplete = useRef(false);
  useEffect(() => {
    const complete = totalItems > 0 && unrankedCount === 0;
    if (complete && !wasComplete.current) {
      setCelebrateNonce((n) => n + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Fully ranked — nice work. ✨', { durationMs: 2600 });
    }
    wasComplete.current = complete;
  }, [totalItems, unrankedCount, toast]);

  // While searching the board, non-matching items dim so matches pop.
  const matchIds = useMemo(() => {
    if (!boardQuery.trim()) return null;
    const set = new Set<string>();
    for (const it of Object.values(list.items)) {
      if (fuzzyScore(boardQuery, it.name) > 0) set.add(it.id);
    }
    return set;
  }, [boardQuery, list.items]);

  const placing = selectedItemId != null;
  const dragging = drag.draggingItem != null;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    drag.scrollY.value = e.contentOffset.y;
  });

  // Native: measure the scroll viewport's window band via measureInWindow.
  const measureBoard = (e: LayoutChangeEvent) => {
    if (Platform.OS === 'web') return; // web handled by measureBoardWeb below
    const node = e?.currentTarget as unknown as
      | { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void }
      | undefined;
    node?.measureInWindow?.((_x, y, _w, h) => {
      if (typeof y === 'number' && h > 0) {
        drag.boardTop.value = y;
        drag.boardBottom.value = y + h;
      }
    });
  };

  // Web: the scroll viewport sits at a fixed spot below the header, so measure
  // its DOM rect (viewport coords, matching the gesture's absoluteY) once the
  // node settles and on resize. scrollY is tracked separately by the handler.
  const measureBoardWeb = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const inst = drag.scrollRef.current as unknown as {
      getScrollableNode?: () => { getBoundingClientRect?: () => DOMRect };
      getBoundingClientRect?: () => DOMRect;
    } | null;
    const node = inst?.getScrollableNode?.() ?? inst;
    const r = node?.getBoundingClientRect?.();
    if (r && r.height > 0) {
      drag.boardTop.value = r.top;
      drag.boardBottom.value = r.bottom;
    }
  }, [drag]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const t = setTimeout(measureBoardWeb, 350);
    window.addEventListener('resize', measureBoardWeb);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measureBoardWeb);
    };
  }, [measureBoardWeb]);

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
      {totalItems > 8 ? (
        <View style={styles.boardSearchWrap}>
          <GlassPanel radius={14}>
            <View style={styles.boardSearchRow}>
              <Text style={styles.boardSearchIcon}>🔍</Text>
              <TextInput
                value={boardQuery}
                onChangeText={setBoardQuery}
                placeholder="Find an item in this board…"
                placeholderTextColor={colors.textLow}
                style={styles.boardSearchInput}
                autoCorrect={false}
              />
              {boardQuery.length > 0 ? (
                <PressableScale onPress={() => setBoardQuery('')} hitSlop={10} style={styles.boardSearchClear}>
                  <Text style={styles.clearText}>✕</Text>
                </PressableScale>
              ) : null}
            </View>
          </GlassPanel>
        </View>
      ) : null}

      <SelectionBar />
      <Animated.ScrollView
        ref={drag.scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollEnabled={!dragging}
        onLayout={measureBoard}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.lg, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.boardColumn}>
          {list.tiers.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              items={tier.itemIds.map((id) => list.items[id]).filter(Boolean)}
              placing={placing}
              selectedItemId={selectedItemId}
              matchIds={matchIds}
              onChipTap={() => handleChipTap(tier)}
              onChipLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSettingsTier(tier);
              }}
              onItemTap={handleItemTap}
            />
          ))}
        </View>
      </Animated.ScrollView>

      <View style={styles.trayWrap}>
        <View style={[styles.boardColumn, { paddingBottom: insets.bottom + spacing.sm }]}>
          <UnrankedTray
            items={list.unrankedIds.map((id) => list.items[id]).filter(Boolean)}
            placing={placing}
            selectedItemId={selectedItemId}
            matchIds={matchIds}
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
      </View>

      <TierSettingsSheet tier={settingsTier} onClose={() => setSettingsTier(null)} />
      <ConfettiBurst nonce={celebrateNonce} />
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

  const handlePublish = async () => {
    close();
    if (!useAuth.getState().user) {
      toast('Sign in to publish — opening Community.');
      router.push('/community');
      return;
    }
    try {
      await publishList(list);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Published to the community 🎉');
    } catch {
      toast('Could not publish. Try again.');
    }
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
          ...(isCommunityEnabled
            ? [{ label: 'Publish to community', icon: '🌐', onPress: handlePublish }]
            : []),
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
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  boardColumn: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: spacing.md,
  },
  trayWrap: { alignItems: 'center' },
  boardSearchWrap: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  boardSearchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  boardSearchIcon: { fontSize: 13, marginRight: spacing.sm },
  boardSearchInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.textHi,
    paddingVertical: spacing.sm + 2,
  },
  boardSearchClear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: colors.textMid, fontSize: 11 },
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
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH - spacing.md * 2,
    alignSelf: 'center',
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
