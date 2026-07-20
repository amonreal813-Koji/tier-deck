import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { GlassPanel } from '@/components/GlassPanel';
import { ItemThumb } from '@/components/ItemThumb';

// Web: skip KeyboardAvoidingView (it breaks input focus). Plain View instead.
const Fill = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
const fillProps = Platform.OS === 'ios' ? { behavior: 'padding' as const } : {};
import { PressableScale } from '@/components/PressableScale';
import { adapters } from '@/data/adapters/registry';
import type { TierItem } from '@/data/types';
import { useListsStore } from '@/store/useListsStore';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

/**
 * Freeform list builder: name a list anything, add any items by typing, then
 * rank them. Real things best-effort pick up a Wikipedia image; anything else
 * gets a clean initials tile.
 */
export default function CustomScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createList = useListsStore((s) => s.createList);

  const [title, setTitle] = useState('');
  const [itemText, setItemText] = useState('');
  const [items, setItems] = useState<TierItem[]>([]);
  const itemInputRef = useRef<TextInput>(null);

  const addItem = () => {
    const name = itemText.trim();
    if (!name) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      setItemText('');
      return;
    }
    Haptics.selectionAsync();
    const id = `custom-${Crypto.randomUUID()}`;
    setItems((prev) => [...prev, { id, name, imageUrl: null, category: 'anything' }]);
    setItemText('');
    itemInputRef.current?.focus();

    // Best-effort art: attach only when the top hit clearly matches, so a
    // personal entry never grabs a random stock photo.
    adapters.anything
      .search(name, new AbortController().signal)
      .then((results) => {
        const hit = results[0];
        if (!hit?.imageUrl) return;
        const a = hit.name.toLowerCase();
        const b = name.toLowerCase();
        if (a === b || a.includes(b) || b.includes(a)) {
          setItems((prev) => prev.map((it) => (it.id === id ? { ...it, imageUrl: hit.imageUrl } : it)));
        }
      })
      .catch(() => {});
  };

  const removeItem = (id: string) => {
    Haptics.selectionAsync();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const canCreate = title.trim().length > 0 && items.length >= 2;

  const create = () => {
    if (!canCreate) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const list = createList(title.trim(), 'anything', items);
    router.replace(`/board/${list.id}`);
  };

  const ctaLabel = !title.trim()
    ? 'Name your list first'
    : items.length < 2
      ? `Add ${2 - items.length} more item${2 - items.length === 1 ? '' : 's'}`
      : `Rank these ${items.length} →`;

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <Fill style={{ flex: 1 }} {...fillProps}>
        <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.topRow}>
            <PressableScale onPress={() => router.back()} style={styles.back} hitSlop={12}>
              <Text style={styles.backText}>←</Text>
            </PressableScale>
            <Text style={styles.kicker}>Start from scratch</Text>
          </View>

          <Animated.Text entering={FadeInDown.springify()} style={styles.title}>
            Your list, your rules.
          </Animated.Text>

          {/* Step 1 — name */}
          <Text style={styles.step}>1 · Name it</Text>
          <GlassPanel radius={14}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Best pizza toppings, My coworkers…"
              placeholderTextColor={colors.textLow}
              style={styles.titleInput}
              autoFocus
              returnKeyType="next"
              maxLength={60}
              onSubmitEditing={() => itemInputRef.current?.focus()}
            />
          </GlassPanel>

          {/* Step 2 — add items */}
          <Text style={styles.step}>2 · Add things to rank {items.length > 0 ? `(${items.length})` : ''}</Text>
          <View style={styles.addRow}>
            <GlassPanel radius={14} style={{ flex: 1 }}>
              <TextInput
                ref={itemInputRef}
                value={itemText}
                onChangeText={setItemText}
                placeholder="Type a name, then Add"
                placeholderTextColor={colors.textLow}
                style={styles.itemInput}
                autoCorrect={false}
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={addItem}
                onKeyPress={(e) => {
                  // Web belt-and-suspenders: Enter adds even if submit doesn't fire.
                  if (e.nativeEvent.key === 'Enter') addItem();
                }}
              />
            </GlassPanel>
            <PressableScale onPress={addItem} disabled={!itemText.trim()} style={{ marginLeft: spacing.sm }}>
              <LinearGradient
                colors={itemText.trim() ? [colors.brandA, colors.brandB] : ['#2A2A33', '#2A2A33']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </LinearGradient>
            </PressableScale>
          </View>

          <ScrollView
            style={{ flex: 1, marginTop: spacing.md }}
            contentContainerStyle={{ paddingBottom: 200 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Add at least 2 things — movies, snacks, friends, anything. You'll drag them into tiers next.
                </Text>
              </View>
            ) : (
              items.map((item, i) => (
                <Animated.View
                  key={item.id}
                  entering={ZoomIn.springify().damping(14).stiffness(200)}
                  exiting={ZoomOut.duration(140)}
                >
                  <View style={styles.itemChip}>
                    <ItemThumb item={item} size={44} radius={10} />
                    <Text style={styles.itemChipName} numberOfLines={1}>{item.name}</Text>
                    <PressableScale onPress={() => removeItem(item.id)} hitSlop={10} style={styles.removeBtn}>
                      <Text style={styles.removeText}>✕</Text>
                    </PressableScale>
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PressableScale onPress={create} disabled={!canCreate} style={{ width: '100%', maxWidth: 520 }}>
            <LinearGradient
              colors={canCreate ? [colors.brandA, colors.brandB] : ['#26262E', '#26262E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createBtn}
            >
              <Text style={[styles.createText, !canCreate && { color: colors.textLow }]}>{ctaLabel}</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      </Fill>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: { fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textLow },
  title: { fontFamily: fonts.display, fontSize: type.display, color: colors.textHi, marginBottom: spacing.lg },
  step: {
    fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, letterSpacing: 0.5,
    color: colors.textLow, marginBottom: spacing.sm, marginTop: spacing.md,
  },
  titleInput: {
    fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
  },
  addRow: { flexDirection: 'row', alignItems: 'center' },
  itemInput: {
    fontFamily: fonts.bodyMedium, fontSize: type.body, color: colors.textHi,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
  },
  addBtn: {
    paddingHorizontal: spacing.lg, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  addBtnText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
  emptyCard: {
    marginTop: spacing.sm, padding: spacing.lg, borderRadius: radii.card,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.surfaceBorder, backgroundColor: 'rgba(255,255,255,0.02)',
  },
  emptyText: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, lineHeight: 20, textAlign: 'center' },
  itemChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm,
    padding: spacing.sm, paddingRight: spacing.md, borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  itemChipName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: withAlpha('#FF3B6B', 0.16),
    borderWidth: 1, borderColor: withAlpha('#FF3B6B', 0.4), alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#FF8FA8', fontSize: 12, fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  createBtn: {
    alignItems: 'center', paddingVertical: spacing.md + 2, borderRadius: radii.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  createText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
});
