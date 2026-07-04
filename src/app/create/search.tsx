import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { GlassPanel } from '@/components/GlassPanel';
import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { adapters } from '@/data/adapters/registry';
import { SearchError, type SearchErrorKind } from '@/data/http';
import type { Category, TierItem } from '@/data/types';
import { useListsStore } from '@/store/useListsStore';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; items: TierItem[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; kind: SearchErrorKind };

const ERROR_COPY: Record<SearchErrorKind, string> = {
  network: 'Lost the connection. Check your internet and try again.',
  auth: 'The API key was rejected — double-check your .env.',
  ratelimit: 'Catching our breath — try again in a moment.',
};

function ResultCard({
  item,
  staged,
  onToggle,
  index,
}: {
  item: TierItem;
  staged: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 35).springify()} style={styles.resultWrap}>
      <PressableScale onPress={onToggle} haptic={false}>
        <GlassPanel radius={radii.panel} style={staged ? styles.resultStaged : undefined}>
          <View style={styles.resultInner}>
            <ItemThumb item={item} size={132} radius={14} />
            <Text style={styles.resultName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.subtitle ? (
              <Text style={styles.resultSub} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
            {staged ? (
              <Animated.View entering={ZoomIn.springify().damping(12).stiffness(200)} style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </Animated.View>
            ) : null}
          </View>
        </GlassPanel>
      </PressableScale>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category: Category; appendTo?: string }>();
  const adapter = adapters[params.category ?? 'games'];

  const createList = useListsStore((s) => s.createList);
  const upsertList = useListsStore((s) => s.upsertList);
  const lists = useListsStore((s) => s.lists);
  const appendTarget = params.appendTo ? lists[params.appendTo] : undefined;

  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [staged, setStaged] = useState<Record<string, TierItem>>({});
  const abortRef = useRef<AbortController | null>(null);

  const stagedList = useMemo(() => Object.values(staged), [staged]);

  const runSearch = useCallback(
    (text: string) => {
      abortRef.current?.abort();
      if (text.trim().length < 2) {
        setState({ status: 'idle' });
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: 'loading' });

      adapter
        .search(text.trim(), controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setState(items.length === 0 ? { status: 'empty', query: text.trim() } : { status: 'results', items });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setState({ status: 'error', kind: err instanceof SearchError ? err.kind : 'network' });
        });
    },
    [adapter]
  );

  // 350ms debounce, abort in-flight request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleStage = (item: TierItem) => {
    Haptics.selectionAsync();
    setStaged((s) => {
      if (s[item.id]) {
        const { [item.id]: _out, ...rest } = s;
        return rest;
      }
      return { ...s, [item.id]: item };
    });
  };

  const handleCreate = () => {
    if (stagedList.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (appendTarget) {
      const existing = new Set([
        ...Object.keys(appendTarget.items),
      ]);
      const fresh = stagedList.filter((i) => !existing.has(i.id));
      upsertList({
        ...appendTarget,
        items: { ...appendTarget.items, ...Object.fromEntries(fresh.map((i) => [i.id, i])) },
        unrankedIds: [...appendTarget.unrankedIds, ...fresh.map((i) => i.id)],
      });
      router.back();
      return;
    }

    const title = query.trim() ? `${adapter.label}: ${query.trim()}` : `${adapter.label} tier list`;
    const list = createList(title, adapter.category, stagedList);
    router.replace(`/board/${list.id}`);
  };

  const renderBody = () => {
    switch (state.status) {
      case 'idle':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerFill}>
            <Text style={styles.bigGlyph}>{adapter.glyph}</Text>
            <Text style={styles.stateTitle}>Search {adapter.label.toLowerCase()}</Text>
            <Text style={styles.stateSub}>Everything you pick lands in the tray below.</Text>
          </Animated.View>
        );
      case 'loading':
        return (
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.resultWrap}>
                <GlassPanel radius={radii.panel}>
                  <View style={styles.resultInner}>
                    <Skeleton width={132} height={132} radius={14} />
                    <Skeleton width={100} height={13} style={{ marginTop: spacing.md }} />
                    <Skeleton width={64} height={10} style={{ marginTop: 6 }} />
                  </View>
                </GlassPanel>
              </View>
            ))}
          </View>
        );
      case 'empty':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerFill}>
            <Text style={styles.bigGlyph}>🫥</Text>
            <Text style={styles.stateTitle}>No results for “{state.query}”</Text>
            <Text style={styles.stateSub}>Typo? Or maybe it's just that obscure.</Text>
          </Animated.View>
        );
      case 'error':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerFill}>
            <Text style={styles.bigGlyph}>📡</Text>
            <Text style={styles.stateTitle}>Hit a snag</Text>
            <Text style={styles.stateSub}>{ERROR_COPY[state.kind]}</Text>
            <PressableScale onPress={() => runSearch(query)} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </PressableScale>
          </Animated.View>
        );
      case 'results':
        return (
          <FlatList
            data={state.items}
            keyExtractor={(i) => i.id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.md }}
            contentContainerStyle={{ gap: spacing.md, paddingBottom: 220 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ResultCard
                item={item}
                index={index}
                staged={!!staged[item.id]}
                onToggle={() => toggleStage(item)}
              />
            )}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.topRow}>
            <PressableScale onPress={() => router.back()} style={styles.back} hitSlop={12}>
              <Text style={styles.backText}>←</Text>
            </PressableScale>
            <View
              style={[
                styles.categoryChip,
                {
                  backgroundColor: withAlpha(adapter.accentColor, 0.14),
                  borderColor: withAlpha(adapter.accentColor, 0.4),
                },
              ]}
            >
              <Text style={styles.categoryChipText}>
                {adapter.glyph} {adapter.label}
              </Text>
            </View>
          </View>

          <GlassPanel radius={16} style={{ marginBottom: spacing.lg }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${adapter.label.toLowerCase()}…`}
              placeholderTextColor={colors.textLow}
              style={styles.input}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query)}
            />
          </GlassPanel>

          <View style={{ flex: 1 }}>{renderBody()}</View>
        </View>

        {stagedList.length > 0 ? (
          <Animated.View
            entering={FadeInDown.springify().damping(16).stiffness(190)}
            style={[styles.tray, { paddingBottom: insets.bottom + spacing.md }]}
          >
            <GlassPanel radius={24}>
              <View style={styles.trayInner}>
                <FlatList
                  horizontal
                  data={stagedList}
                  keyExtractor={(i) => i.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
                  renderItem={({ item }) => (
                    <Animated.View entering={ZoomIn.springify().damping(12).stiffness(200)} exiting={ZoomOut.duration(150)}>
                      <PressableScale onPress={() => toggleStage(item)}>
                        <ItemThumb item={item} size={48} radius={10} />
                      </PressableScale>
                    </Animated.View>
                  )}
                />
                <PressableScale onPress={handleCreate} style={styles.createWrap}>
                  <LinearGradient
                    colors={[colors.brandA, colors.brandB]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createButton}
                  >
                    <Text style={styles.createText}>
                      {appendTarget ? `Add ${stagedList.length}` : `Create board (${stagedList.length})`}
                    </Text>
                  </LinearGradient>
                </PressableScale>
              </View>
            </GlassPanel>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  categoryChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: colors.textHi,
  },
  input: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body + 1,
    color: colors.textHi,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
    gap: 6,
  },
  bigGlyph: { fontSize: 44, marginBottom: spacing.sm },
  stateTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
    textAlign: 'center',
  },
  stateSub: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  retryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: colors.textHi,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  resultWrap: { flex: 1, minWidth: '45%' },
  resultStaged: {
    borderColor: withAlpha('#7C5CFF', 0.65),
  },
  resultInner: {
    padding: spacing.md,
    alignItems: 'center',
  },
  resultName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: colors.textHi,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  resultSub: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textLow,
    marginTop: 3,
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brandA,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  checkText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  tray: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
  },
  trayInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  createWrap: { marginLeft: spacing.sm },
  createButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  createText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: '#FFF',
  },
});
