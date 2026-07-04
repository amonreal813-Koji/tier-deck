import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { GlassPanel } from '@/components/GlassPanel';
import { PressableScale } from '@/components/PressableScale';
import { colors, fonts, spacing, type } from '@/theme/tokens';

interface ToastState {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
  nonce: number;
  show: (message: string, opts?: { actionLabel?: string; onAction?: () => void; durationMs?: number }) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  durationMs: 4000,
  nonce: 0,
  show: (message, opts) =>
    set((s) => ({
      message,
      actionLabel: opts?.actionLabel,
      onAction: opts?.onAction,
      durationMs: opts?.durationMs ?? 4000,
      nonce: s.nonce + 1,
    })),
  hide: () => set({ message: null, actionLabel: undefined, onAction: undefined }),
}));

/** Global toast host — mounted once in the root layout, above everything. */
export function ToastHost() {
  const { message, actionLabel, onAction, durationMs, nonce, hide } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, durationMs);
    return () => clearTimeout(t);
  }, [message, nonce, durationMs, hide]);

  if (!message) return null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}>
      <Animated.View
        entering={SlideInDown.springify().damping(15).stiffness(180)}
        exiting={SlideOutDown.duration(200)}
        style={{ marginHorizontal: spacing.lg, marginBottom: insets.bottom + spacing.lg }}
      >
        <GlassPanel radius={16}>
          <View style={styles.row}>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
            {actionLabel ? (
              <PressableScale
                onPress={() => {
                  onAction?.();
                  hide();
                }}
                style={styles.action}
              >
                <Text style={styles.actionText}>{actionLabel}</Text>
              </PressableScale>
            ) : null}
          </View>
        </GlassPanel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  message: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.textHi,
  },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
    backgroundColor: 'rgba(124,92,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.45)',
  },
  actionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    color: '#B9A5FF',
  },
});
