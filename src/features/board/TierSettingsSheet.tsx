import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/GlassPanel';
import { GlowBadge } from '@/components/GlowBadge';
import { PressableScale } from '@/components/PressableScale';
import type { Tier } from '@/data/types';
import { useEditorStore } from '@/store/useEditorStore';
import { TIER_SWATCHES, withAlpha } from '@/theme/tierColors';
import { colors, fonts, spacing, type } from '@/theme/tokens';

interface TierSettingsSheetProps {
  tier: Tier | null;
  onClose: () => void;
}

/**
 * Per-tier settings: rename, recolor (glow retints live), reorder, delete.
 * Opened by long-pressing a tier's label chip.
 */
export function TierSettingsSheet({ tier, onClose }: TierSettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const renameTier = useEditorStore((s) => s.renameTier);
  const recolorTier = useEditorStore((s) => s.recolorTier);
  const removeTier = useEditorStore((s) => s.removeTier);
  const moveTier = useEditorStore((s) => s.moveTier);
  const tierCount = useEditorStore((s) => s.list?.tiers.length ?? 0);
  // Live tier from the store so the preview updates as edits land.
  const liveTier = useEditorStore((s) => s.list?.tiers.find((t) => t.id === tier?.id));

  const [label, setLabel] = useState('');

  useEffect(() => {
    if (tier) setLabel(tier.label);
  }, [tier]);

  const current = liveTier ?? tier;
  if (!tier || !current) {
    return null;
  }

  const commitLabel = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== current.label) {
      renameTier(tier.id, trimmed.slice(0, 12));
    } else {
      setLabel(current.label);
    }
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(16).stiffness(190)}
          exiting={SlideOutDown.duration(180)}
          style={{ marginHorizontal: spacing.md, marginBottom: insets.bottom + spacing.md }}
        >
          <GlassPanel radius={24}>
            <View style={styles.inner}>
              <View style={styles.grabber} />

              <View style={styles.previewRow}>
                <GlowBadge label={current.label} color={current.color} size={64} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Tier name</Text>
                  <TextInput
                    value={label}
                    onChangeText={setLabel}
                    onBlur={commitLabel}
                    onSubmitEditing={commitLabel}
                    maxLength={12}
                    style={styles.input}
                    placeholderTextColor={colors.textLow}
                    returnKeyType="done"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.swatches}>
                {TIER_SWATCHES.map((swatch) => {
                  const active = swatch === current.color;
                  return (
                    <PressableScale
                      key={swatch}
                      scaleTo={0.85}
                      onPress={() => {
                        Haptics.selectionAsync();
                        recolorTier(tier.id, swatch);
                      }}
                      style={[
                        styles.swatch,
                        { backgroundColor: swatch },
                        active && { borderColor: '#FFFFFF', borderWidth: 2.5, transform: [{ scale: 1.12 }] },
                      ]}
                    >
                      <View />
                    </PressableScale>
                  );
                })}
              </View>

              <View style={styles.actionsRow}>
                <PressableScale onPress={() => moveTier(tier.id, -1)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>↑ Move up</Text>
                </PressableScale>
                <PressableScale onPress={() => moveTier(tier.id, 1)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>↓ Move down</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    if (tierCount <= 1) return;
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    removeTier(tier.id);
                    onClose();
                  }}
                  style={[styles.actionBtn, styles.deleteBtn, tierCount <= 1 && { opacity: 0.4 }]}
                >
                  <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
                </PressableScale>
              </View>
            </View>
          </GlassPanel>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4,4,8,0.6)',
  },
  inner: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.micro,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textLow,
    marginBottom: spacing.xs + 2,
  },
  input: {
    fontFamily: fonts.displayMedium,
    fontSize: type.heading,
    color: colors.textHi,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: withAlpha('#FFFFFF', 0.25),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,77,109,0.10)',
    borderColor: 'rgba(255,77,109,0.35)',
  },
  actionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: colors.textHi,
  },
});
