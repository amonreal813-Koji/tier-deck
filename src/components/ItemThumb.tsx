import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TierItem } from '@/data/types';
import { CATEGORY_ACCENTS, withAlpha } from '@/theme/tierColors';
import { fonts } from '@/theme/tokens';

const BLURHASH = 'L03[%b~qofj[~qj[ofj[4nWBofWB';

interface ItemThumbProps {
  item: TierItem;
  size?: number;
  radius?: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/**
 * The universal item tile: cover art when we have it, otherwise initials on
 * the category gradient. Used in search results, the staging tray, the board
 * and the export canvas.
 */
export function ItemThumb({ item, size = 64, radius = 12 }: ItemThumbProps) {
  const accent = CATEGORY_ACCENTS[item.category] ?? '#7C5CFF';

  if (!item.imageUrl) {
    return (
      <LinearGradient
        colors={[withAlpha(accent, 0.55), withAlpha(accent, 0.2)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tile, { width: size, height: size, borderRadius: radius }]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.3 }]}>{initials(item.name)}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: size, height: size }}
        contentFit="cover"
        placeholder={{ blurhash: BLURHASH }}
        transition={200}
        cachePolicy="disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.display,
    color: 'rgba(255,255,255,0.92)',
  },
});
