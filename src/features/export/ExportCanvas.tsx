import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TierList } from '@/data/types';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts } from '@/theme/tokens';

const THUMB = 52;

interface ExportCanvasProps {
  list: TierList;
  width: number;
  /** Called once per remote image that finishes (or fails) loading. */
  onImageSettled: () => void;
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
 * The dedicated capture target — a clean, solid-background rendition of the
 * board (no blur, no scroll, nothing off-screen). Captured at device pixel
 * ratio, so a ~360dp canvas lands at ~1080px.
 */
export function ExportCanvas({ list, width, onImageSettled }: ExportCanvasProps) {
  return (
    <View style={[styles.canvas, { width }]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {list.title}
        </Text>
      </View>

      {list.tiers.map((tier) => (
        <View key={tier.id} style={styles.row}>
          <View style={[styles.chip, { backgroundColor: tier.color }]}>
            <Text style={styles.chipLabel} numberOfLines={1} adjustsFontSizeToFit>
              {tier.label}
            </Text>
          </View>
          <View style={styles.items}>
            {tier.itemIds.map((id) => {
              const item = list.items[id];
              if (!item) return null;
              return item.imageUrl ? (
                <Image
                  key={id}
                  source={{ uri: item.imageUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                  cachePolicy="disk"
                  onLoad={onImageSettled}
                  onError={onImageSettled}
                />
              ) : (
                <LinearGradient
                  key={id}
                  colors={[withAlpha(tier.color, 0.5), withAlpha(tier.color, 0.18)]}
                  style={[styles.thumb, styles.initialsTile]}
                >
                  <Text style={styles.initials}>{initials(item.name)}</Text>
                </LinearGradient>
              );
            })}
            {tier.itemIds.length === 0 ? <View style={{ height: THUMB }} /> : null}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <View style={styles.footerBars}>
          {list.tiers.slice(0, 6).map((t) => (
            <View key={t.id} style={[styles.footerBar, { backgroundColor: t.color }]} />
          ))}
        </View>
        <Text style={styles.watermark}>made with Tier Deck</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: colors.bg,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textHi,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    width: 46,
    minHeight: THUMB + 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  chipLabel: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: '#0A0A0F',
  },
  items: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
  },
  initialsTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerBars: {
    flexDirection: 'row',
    gap: 3,
  },
  footerBar: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  watermark: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textLow,
    letterSpacing: 0.5,
  },
});
