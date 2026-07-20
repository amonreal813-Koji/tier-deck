import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

// On web, KeyboardAvoidingView is pointless and interferes with input focus
// (clicking the search bar leaves it unusable). Use a plain View there.
const Fill = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
const fillProps = Platform.OS === 'ios' ? { behavior: 'padding' as const } : {};
import Animated, { FadeIn, FadeInDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { GlassPanel } from '@/components/GlassPanel';
import { ItemThumb } from '@/components/ItemThumb';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { FACETS, fetchCollection, searchSubjects, type Facet, type Subject } from '@/data/topic';
import type { TierItem } from '@/data/types';
import { useListsStore } from '@/store/useListsStore';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';

type CollState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; items: TierItem[] }
  | { status: 'empty' };

type SubjState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; items: Subject[] }
  | { status: 'empty' }
  | { status: 'error' };

export default function TopicScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createList = useListsStore((s) => s.createList);

  const [subjectQuery, setSubjectQuery] = useState('');
  const [subjState, setSubjState] = useState<SubjState>({ status: 'idle' });
  const [subject, setSubject] = useState<Subject | null>(null);
  const [facet, setFacet] = useState<Facet | null>(null);
  const [coll, setColl] = useState<CollState>({ status: 'idle' });
  const [staged, setStaged] = useState<Record<string, TierItem>>({});
  const [manualText, setManualText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const stagedList = useMemo(() => Object.values(staged), [staged]);

  // Debounced subject autocomplete with visible loading / empty / error states.
  useEffect(() => {
    if (subject) return;
    if (subjectQuery.trim().length < 2) {
      abortRef.current?.abort();
      setSubjState({ status: 'idle' });
      return;
    }
    const t = setTimeout(() => {
      abortRef.current?.abort();
      const c = new AbortController();
      abortRef.current = c;
      setSubjState({ status: 'loading' });
      searchSubjects(subjectQuery, c.signal)
        .then((s) => {
          if (c.signal.aborted) return;
          setSubjState(s.length ? { status: 'results', items: s } : { status: 'empty' });
        })
        .catch(() => {
          if (!c.signal.aborted) setSubjState({ status: 'error' });
        });
    }, 300);
    return () => clearTimeout(t);
  }, [subjectQuery, subject]);

  const retrySubjects = useCallback(() => {
    const q = subjectQuery.trim();
    if (q.length < 2) return;
    abortRef.current?.abort();
    const c = new AbortController();
    abortRef.current = c;
    setSubjState({ status: 'loading' });
    searchSubjects(q, c.signal)
      .then((s) => {
        if (c.signal.aborted) return;
        setSubjState(s.length ? { status: 'results', items: s } : { status: 'empty' });
      })
      .catch(() => {
        if (!c.signal.aborted) setSubjState({ status: 'error' });
      });
  }, [subjectQuery]);

  const loadFacet = useCallback(
    (subj: Subject, f: Facet) => {
      abortRef.current?.abort();
      const c = new AbortController();
      abortRef.current = c;
      setFacet(f);
      setColl({ status: 'loading' });
      fetchCollection(subj.title, f, c.signal)
        .then((items) => {
          if (c.signal.aborted) return;
          setColl(items.length ? { status: 'results', items } : { status: 'empty' });
        })
        .catch(() => !c.signal.aborted && setColl({ status: 'empty' }));
    },
    []
  );

  const pickSubject = (s: Subject) => {
    Haptics.selectionAsync();
    setSubject(s);
    setSubjState({ status: 'idle' });
    loadFacet(s, FACETS[0]); // default to Characters; user can switch
  };

  const resetSubject = () => {
    abortRef.current?.abort();
    setSubject(null);
    setFacet(null);
    setColl({ status: 'idle' });
    setSubjState({ status: 'idle' });
    setStaged({});
    setSubjectQuery('');
  };

  const toggle = (item: TierItem) => {
    Haptics.selectionAsync();
    setStaged((s) => {
      if (s[item.id]) {
        const { [item.id]: _out, ...rest } = s;
        return rest;
      }
      return { ...s, [item.id]: item };
    });
  };

  // Manual add — the safety net so any topic can become a list, even when
  // Wikipedia has nothing for it.
  const addManual = () => {
    const name = manualText.trim();
    if (!name) return;
    Haptics.selectionAsync();
    const id = `custom-${Crypto.randomUUID()}`;
    setStaged((s) => ({ ...s, [id]: { id, name, imageUrl: null, category: 'anything' } }));
    setManualText('');
  };

  const create = () => {
    if (!subject || !facet || stagedList.length < 2) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const title = `${subject.title} ${facet.label}`;
    const list = createList(title, 'anything', stagedList);
    router.replace(`/board/${list.id}`);
  };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <Fill style={{ flex: 1 }} {...fillProps}>
        <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.topRow}>
            <PressableScale onPress={() => router.back()} style={styles.back} hitSlop={12}>
              <Text style={styles.backText}>←</Text>
            </PressableScale>
            <Text style={styles.kicker}>Rank a topic</Text>
          </View>

          {!subject ? (
            <>
              <Animated.Text entering={FadeInDown.springify()} style={styles.title}>
                What do you want to rank?
              </Animated.Text>
              <Text style={styles.sub}>Search a game, show, movie, band — anything with a fandom.</Text>
              <GlassPanel radius={16} style={{ marginTop: spacing.md }}>
                <TextInput
                  value={subjectQuery}
                  onChangeText={setSubjectQuery}
                  placeholder="e.g. Elden Ring, The Office, Pokémon…"
                  placeholderTextColor={colors.textLow}
                  style={styles.input}
                  autoFocus
                  autoCorrect={false}
                />
              </GlassPanel>
              {subjState.status === 'loading' ? (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} width={'100%' as unknown as number} height={66} radius={14} />
                  ))}
                </View>
              ) : subjState.status === 'empty' ? (
                <Animated.View entering={FadeIn} style={styles.subjMessage}>
                  <Text style={styles.bigGlyph}>🔍</Text>
                  <Text style={styles.emptyTitle}>No matches for “{subjectQuery.trim()}”</Text>
                  <Text style={styles.sub}>Check the spelling, or build your list from scratch.</Text>
                  <PressableScale onPress={() => router.replace('/create/custom')} style={styles.subjAction}>
                    <Text style={styles.subjActionText}>Start from scratch →</Text>
                  </PressableScale>
                </Animated.View>
              ) : subjState.status === 'error' ? (
                <Animated.View entering={FadeIn} style={styles.subjMessage}>
                  <Text style={styles.bigGlyph}>📡</Text>
                  <Text style={styles.emptyTitle}>Couldn’t reach search</Text>
                  <Text style={styles.sub}>Check your connection and try again.</Text>
                  <PressableScale onPress={retrySubjects} style={styles.subjAction}>
                    <Text style={styles.subjActionText}>Try again</Text>
                  </PressableScale>
                </Animated.View>
              ) : (
                <FlatList
                  data={subjState.status === 'results' ? subjState.items : []}
                  keyExtractor={(s) => s.title}
                  keyboardShouldPersistTaps="handled"
                  style={{ marginTop: spacing.md }}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 35).springify()}>
                      <PressableScale onPress={() => pickSubject(item)} style={{ marginBottom: spacing.sm }}>
                        <GlassPanel radius={14}>
                          <View style={styles.subjectRow}>
                            <ItemThumb
                              item={{ id: item.title, name: item.title, imageUrl: item.imageUrl ?? null, category: 'anything' }}
                              size={46}
                              radius={10}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.subjectName} numberOfLines={1}>{item.title}</Text>
                              {item.description ? (
                                <Text style={styles.subjectDesc} numberOfLines={1}>{item.description}</Text>
                              ) : null}
                            </View>
                            <Text style={styles.subjectArrow}>→</Text>
                          </View>
                        </GlassPanel>
                      </PressableScale>
                    </Animated.View>
                  )}
                />
              )}
            </>
          ) : (
            <>
              <PressableScale onPress={resetSubject} style={styles.subjectChip}>
                <Text style={styles.subjectChipText} numberOfLines={1}>{subject.title}  ✕</Text>
              </PressableScale>
              <Text style={styles.sub}>Pick what to rank:</Text>
              <FlatList
                horizontal
                data={FACETS}
                keyExtractor={(f) => f.key}
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: spacing.sm, marginBottom: spacing.md, flexGrow: 0 }}
                contentContainerStyle={{ gap: spacing.sm }}
                renderItem={({ item: f }) => {
                  const active = facet?.key === f.key;
                  return (
                    <PressableScale
                      onPress={() => loadFacet(subject, f)}
                      style={[styles.facet, active && styles.facetActive]}
                    >
                      <Text style={[styles.facetText, active && { color: colors.textHi }]}>
                        {f.glyph} {f.label}
                      </Text>
                    </PressableScale>
                  );
                }}
              />

              {/* Manual add — always available, so any topic works. */}
              <View style={styles.manualRow}>
                <TextInput
                  value={manualText}
                  onChangeText={setManualText}
                  placeholder={`Add a ${(facet?.label ?? 'thing').toLowerCase().replace(/s$/, '')} yourself…`}
                  placeholderTextColor={colors.textLow}
                  style={styles.manualInput}
                  autoCorrect={false}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  onSubmitEditing={addManual}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Enter') addManual();
                  }}
                />
                <PressableScale onPress={addManual} disabled={!manualText.trim()} style={styles.manualAdd}>
                  <Text style={[styles.manualAddText, !manualText.trim() && { opacity: 0.4 }]}>Add</Text>
                </PressableScale>
              </View>

              <View style={{ flex: 1 }}>
                {coll.status === 'loading' ? (
                  <View style={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View key={i} style={styles.cardWrap}>
                        <Skeleton width={'100%' as unknown as number} height={100} radius={14} />
                      </View>
                    ))}
                  </View>
                ) : coll.status === 'empty' ? (
                  stagedList.length > 0 ? (
                    <FlatList
                      data={stagedList}
                      keyExtractor={(i) => i.id}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingBottom: 200 }}
                      renderItem={({ item }) => (
                        <View style={styles.stagedRow}>
                          <ItemThumb item={item} size={40} radius={10} />
                          <Text style={styles.stagedName} numberOfLines={1}>{item.name}</Text>
                          <PressableScale onPress={() => toggle(item)} hitSlop={10} style={styles.stagedRemove}>
                            <Text style={styles.stagedRemoveText}>✕</Text>
                          </PressableScale>
                        </View>
                      )}
                    />
                  ) : (
                    <Animated.View entering={FadeIn} style={styles.centerFill}>
                      <Text style={styles.bigGlyph}>✍️</Text>
                      <Text style={styles.emptyTitle}>Nothing auto-found for {facet?.label.toLowerCase()}</Text>
                      <Text style={styles.sub}>No problem — type them in the box above ☝️, or try another tab.</Text>
                    </Animated.View>
                  )
                ) : coll.status === 'results' ? (
                  <FlatList
                    data={coll.items}
                    keyExtractor={(i) => i.id}
                    numColumns={3}
                    columnWrapperStyle={{ gap: spacing.md }}
                    contentContainerStyle={{ gap: spacing.md, paddingBottom: 200 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                      const on = !!staged[item.id];
                      return (
                        <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 25).springify()} style={styles.cardWrap}>
                          <PressableScale onPress={() => toggle(item)} style={{ alignItems: 'center' }}>
                            <View style={[styles.thumbFrame, on && styles.thumbFrameOn]}>
                              <ItemThumb item={item} size={94} radius={13} />
                            </View>
                            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                            {on ? (
                              <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
                            ) : null}
                          </PressableScale>
                        </Animated.View>
                      );
                    }}
                  />
                ) : null}
              </View>
            </>
          )}
        </View>

        {stagedList.length > 0 ? (
          <Animated.View
            entering={FadeInDown.springify().damping(16).stiffness(190)}
            style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
          >
            <PressableScale onPress={create} style={{ width: '100%', maxWidth: 520 }} disabled={stagedList.length < 2}>
              <LinearGradient
                colors={stagedList.length >= 2 ? [colors.brandA, colors.brandB] : ['#2A2A33', '#2A2A33']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createBtn}
              >
                <Text style={styles.createText}>
                  {stagedList.length < 2 ? `Pick ${2 - stagedList.length} more` : `Rank these ${stagedList.length} →`}
                </Text>
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        ) : null}
      </Fill>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg, width: '100%', maxWidth: 820, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: { fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textLow },
  title: { fontFamily: fonts.display, fontSize: type.title, color: colors.textHi },
  sub: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid, marginTop: 4 },
  input: { fontFamily: fonts.bodyMedium, fontSize: type.body + 1, color: colors.textHi, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm + 2 },
  subjectName: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  subjectDesc: { fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textLow, marginTop: 1 },
  subjectArrow: { color: '#B9A5FF', fontSize: 18, paddingRight: spacing.sm },
  subjectChip: {
    alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 3,
    borderRadius: radii.pill, backgroundColor: withAlpha('#7C5CFF', 0.2), borderWidth: 1, borderColor: withAlpha('#7C5CFF', 0.5),
  },
  subjectChipText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#C9BBFF', maxWidth: 280 },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  manualInput: {
    flex: 1, fontFamily: fonts.bodyMedium, fontSize: type.caption + 1, color: colors.textHi,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radii.card,
  },
  manualAdd: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radii.card,
    backgroundColor: withAlpha('#7C5CFF', 0.2), borderWidth: 1, borderColor: withAlpha('#7C5CFF', 0.5),
  },
  manualAddText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#B9A5FF' },
  stagedRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm,
    padding: spacing.sm, paddingRight: spacing.md, borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  stagedName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  stagedRemove: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: withAlpha('#FF3B6B', 0.16),
    borderWidth: 1, borderColor: withAlpha('#FF3B6B', 0.4), alignItems: 'center', justifyContent: 'center',
  },
  stagedRemoveText: { color: '#FF8FA8', fontSize: 11, fontWeight: '700' },
  facet: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 3, borderRadius: radii.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  facetActive: { backgroundColor: withAlpha('#7C5CFF', 0.22), borderColor: withAlpha('#7C5CFF', 0.6) },
  facetText: { fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, color: colors.textMid },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardWrap: { flex: 1, maxWidth: '31%', alignItems: 'center' },
  thumbFrame: { borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  thumbFrameOn: { borderColor: colors.brandA },
  cardName: { fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, color: colors.textHi, marginTop: 6, maxWidth: 94, textAlign: 'center' },
  check: {
    position: 'absolute', top: -4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brandA,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  checkText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120, gap: 4 },
  subjMessage: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xl * 1.5, paddingHorizontal: spacing.lg, gap: 4 },
  subjAction: {
    marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radii.pill,
    backgroundColor: withAlpha('#7C5CFF', 0.2), borderWidth: 1, borderColor: withAlpha('#7C5CFF', 0.5),
  },
  subjActionText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#C9BBFF' },
  bigGlyph: { fontSize: 42, marginBottom: spacing.sm },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: type.heading, color: colors.textHi, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  createBtn: { alignItems: 'center', paddingVertical: spacing.md + 2, borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  createText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
});
