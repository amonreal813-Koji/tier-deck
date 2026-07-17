import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isEmojiAvatar, emojiOf, tileColorFor } from '@/data/avatars';
import { colors, fonts } from '@/theme/tokens';

/**
 * A community profile avatar. Renders an emoji tile (`emoji:🎮`), a real image
 * URL (Google photo / curated cover), or an initials fallback — so it never
 * shows a broken image.
 */
export function Avatar({
  url,
  name,
  size = 44,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
}) {
  const radius = size / 2;

  if (isEmojiAvatar(url)) {
    return (
      <View style={[styles.circle, { width: size, height: size, borderRadius: radius, backgroundColor: tileColorFor(url) }]}>
        <Text style={{ fontSize: size * 0.5 }}>{emojiOf(url)}</Text>
      </View>
    );
  }

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.surface }}
        contentFit="cover"
        cachePolicy="disk"
      />
    );
  }

  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: radius, backgroundColor: colors.surface }]}>
      <Text style={{ fontSize: size * 0.42, fontFamily: fonts.display, color: colors.textHi }}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
