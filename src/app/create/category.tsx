import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { listCategories } from '@/data/adapters/registry';
import type { CategoryAdapter } from '@/data/adapters/types';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, spacing, springs, type } from '@/theme/tokens';

function CategoryCard({ adapter, index }: { adapter: CategoryAdapter; index: number }) {
  const router = useRouter();
  const configured = adapter.isConfigured();
  const [showHint, setShowHint] = useState(false);
  const flip = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${180 + flip.value * 180}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const handlePress = () => {
    if (!configured) {
      // Flip to the setup hint and back on second tap.
      const next = showHint ? 0 : 1;
      setShowHint(!showHint);
      flip.value = withSpring(next, springs.gentle);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/create/search', params: { category: adapter.category } });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 70).springify()}
      style={styles.cardWrap}
    >
      <PressableScale onPress={handlePress} haptic={false} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
            <GlassPanel
              style={[styles.card, !configured && { opacity: 0.65 }]}
              tint={withAlpha(adapter.accentColor, 0.07)}
            >
              <View style={styles.cardInner}>
                <View
                  style={[
                    styles.glyphBubble,
                    {
                      backgroundColor: withAlpha(adapter.accentColor, 0.16),
                      borderColor: withAlpha(adapter.accentColor, 0.4),
                    },
                  ]}
                >
                  <Text style={styles.glyph}>{adapter.glyph}</Text>
                </View>
                <Text style={styles.label}>{adapter.label}</Text>
                <Text style={styles.blurb} numberOfLines={2}>
                  {adapter.blurb}
                </Text>
                {!configured ? (
                  <View style={styles.setupBadge}>
                    <Text style={styles.setupBadgeText}>Setup needed</Text>
                  </View>
                ) : null}
              </View>
            </GlassPanel>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
            <GlassPanel style={styles.card} tint={withAlpha(adapter.accentColor, 0.07)}>
              <View style={[styles.cardInner, { justifyContent: 'center' }]}>
                <Text style={styles.hintText}>{adapter.configHint}</Text>
                <Text style={styles.hintDismiss}>Tap to flip back</Text>
              </View>
            </GlassPanel>
          </Animated.View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const categories = listCategories();

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <Animated.Text entering={FadeInDown.springify()} style={styles.title}>
          Rank what?
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(40).springify()} style={styles.subtitle}>
          Start from scratch, or pull from a universe.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <PressableScale onPress={() => router.push('/create/topic')} style={{ marginBottom: spacing.md }}>
            <GlassPanel radius={18} tint={withAlpha('#4ADE80', 0.1)}>
              <View style={styles.blankRow}>
                <View style={[styles.blankGlyph, { backgroundColor: withAlpha('#4ADE80', 0.16), borderColor: withAlpha('#4ADE80', 0.4) }]}>
                  <Text style={{ fontSize: 22 }}>🔎</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blankTitle}>Rank a topic</Text>
                  <Text style={styles.blankSub}>Search a game or show — we pull its characters, episodes & more.</Text>
                </View>
                <Text style={[styles.blankArrow, { color: '#8BF0B0' }]}>→</Text>
              </View>
            </GlassPanel>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(55).springify()}>
          <PressableScale onPress={() => router.push('/create/custom')} style={{ marginBottom: spacing.lg }}>
            <GlassPanel radius={18} tint={withAlpha('#7C5CFF', 0.1)}>
              <View style={styles.blankRow}>
                <View style={styles.blankGlyph}>
                  <Text style={{ fontSize: 22 }}>✏️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blankTitle}>Start from scratch</Text>
                  <Text style={styles.blankSub}>Name it anything, add any items, rank it your way.</Text>
                </View>
                <Text style={styles.blankArrow}>→</Text>
              </View>
            </GlassPanel>
          </PressableScale>
        </Animated.View>

        <View style={styles.grid}>
          {categories.map((adapter, i) => (
            <CategoryCard key={adapter.category} adapter={adapter} index={i} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg, width: '100%', maxWidth: 760, alignSelf: 'center' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  backText: { color: colors.textHi, fontSize: 18 },
  title: {
    fontFamily: fonts.display,
    fontSize: type.display,
    color: colors.textHi,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.textMid,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  blankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  blankGlyph: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#7C5CFF', 0.16),
    borderWidth: 1,
    borderColor: withAlpha('#7C5CFF', 0.4),
  },
  blankTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
  },
  blankSub: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    marginTop: 2,
  },
  blankArrow: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: '#B9A5FF',
  },
  cardWrap: {
    width: '48%',
    aspectRatio: 0.92,
    flexGrow: 1,
  },
  card: { flex: 1 },
  cardInner: {
    flex: 1,
    padding: spacing.lg,
  },
  glyphBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  glyph: { fontSize: 24 },
  label: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
  },
  blurb: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    marginTop: 4,
  },
  setupBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,210,63,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,63,0.4)',
  },
  setupBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFD23F',
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textHi,
    lineHeight: 19,
  },
  hintDismiss: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textLow,
    marginTop: spacing.md,
  },
});
