import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/PressableScale';
import { resolveArt } from '@/data/premade/art';
import type { ArtSpec } from '@/data/premade/types';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, springs, type } from '@/theme/tokens';

export interface Strip {
  color: string;
  weight: number;
}

interface GridListCardProps {
  title: string;
  subtitle?: string;
  glyph: string;
  accent: string;
  strips: Strip[];
  badge?: string;
  /** Pre-resolved image (user lists). */
  heroUri?: string | null;
  /** Art spec to resolve lazily (curated lists). */
  heroSpec?: ArtSpec;
  width: number;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const CARD_HEIGHT = 168;

export function GridListCard({
  title,
  subtitle,
  glyph,
  accent,
  strips,
  badge,
  heroUri,
  heroSpec,
  width,
  index,
  onPress,
  onLongPress,
}: GridListCardProps) {
  const [resolved, setResolved] = useState<string | null>(heroUri ?? null);

  useEffect(() => {
    if (heroUri !== undefined) {
      setResolved(heroUri);
      return;
    }
    if (!heroSpec) return;
    let alive = true;
    resolveArt(heroSpec).then((uri) => {
      if (alive) setResolved(uri);
    });
    return () => {
      alive = false;
    };
  }, [heroSpec, heroUri]);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 45).springify().damping(springs.gentle.damping)}
      style={{ width }}
    >
      <PressableScale onPress={onPress} onLongPress={onLongPress} delayLongPress={350} scaleTo={0.97}>
        <View style={[styles.card, { height: CARD_HEIGHT }]}>
          {/* Background: accent wash always, photo fades in over it. */}
          <LinearGradient
            colors={[withAlpha(accent, 0.5), withAlpha(accent, 0.18)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {resolved ? (
            <Animated.View entering={FadeIn.duration(280)} style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: resolved }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                cachePolicy="disk"
              />
            </Animated.View>
          ) : null}
          {/* Legibility scrim: darker toward the bottom where text sits. */}
          <LinearGradient
            colors={['rgba(8,8,12,0.15)', 'rgba(8,8,12,0.55)', 'rgba(8,8,12,0.92)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={[styles.glyphBubble, { borderColor: withAlpha(accent, 0.6) }]}>
                <Text style={styles.glyph}>{glyph}</Text>
              </View>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>

            <View>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
              <View style={styles.strip}>
                {strips.map((s, i) => (
                  <View
                    key={i}
                    style={{
                      flex: Math.max(s.weight, 0.35),
                      backgroundColor: s.color,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.panel,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    padding: spacing.md + 2,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glyphBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
  },
  glyph: { fontSize: 20 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.textHi,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: type.heading,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  strip: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
    marginTop: spacing.sm + 2,
  },
});
