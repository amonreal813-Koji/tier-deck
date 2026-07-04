import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { colors, fonts, spacing, type } from '@/theme/tokens';

export interface SheetAction {
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}

/** Bottom action sheet on glass — springs up, dims the world behind it. */
export function ActionSheet({ visible, title, actions, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
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
              {title ? (
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {actions.map((action) => (
                <PressableScale
                  key={action.label}
                  scaleTo={0.97}
                  onPress={() => {
                    onClose();
                    // Let the sheet start dismissing before the action lands.
                    setTimeout(action.onPress, 120);
                  }}
                  style={styles.row}
                >
                  {action.icon ? <Text style={styles.icon}>{action.icon}</Text> : null}
                  <Text style={[styles.label, action.destructive && { color: colors.danger }]}>
                    {action.label}
                  </Text>
                </PressableScale>
              ))}
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: colors.textLow,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
  },
  icon: { fontSize: 18 },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body + 1,
    color: colors.textHi,
  },
});
