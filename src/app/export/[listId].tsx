import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { ExportCanvas } from '@/features/export/ExportCanvas';
import { useListsStore } from '@/store/useListsStore';
import { DEFAULT_TIERS } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, springs, type } from '@/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;
const CANVAS_W = Math.min(SCREEN_W - spacing.lg * 2, 400);

/** Eight tier-colored dots springing outward — the success moment. */
function ConfettiBurst({ nonce }: { nonce: number }) {
  if (nonce === 0) return null;
  return (
    <View pointerEvents="none" style={styles.confettiWrap}>
      {Array.from({ length: 8 }).map((_, i) => (
        <ConfettiDot key={`${nonce}-${i}`} index={i} />
      ))}
    </View>
  );
}

function ConfettiDot({ index }: { index: number }) {
  const t = useSharedValue(0);
  const color = DEFAULT_TIERS[index % DEFAULT_TIERS.length].color;
  const angle = (index / 8) * Math.PI * 2 + 0.4;

  useEffect(() => {
    t.value = withDelay(index * 25, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * t.value * 90 },
      { translateY: Math.sin(angle) * t.value * 90 },
      { scale: 1 - t.value * 0.4 },
    ],
  }));

  return <Animated.View style={[styles.confettiDot, { backgroundColor: color }, style]} />;
}

export default function ExportScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const list = useListsStore((s) => (listId ? s.lists[listId] : undefined));

  const canvasRef = useRef<View>(null);
  const [settled, setSettled] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confettiNonce, setConfettiNonce] = useState(0);
  const [ready, setReady] = useState(false);

  const remoteImages = useMemo(() => {
    if (!list) return 0;
    const ranked = list.tiers.flatMap((t) => t.itemIds);
    return ranked.filter((id) => list.items[id]?.imageUrl).length;
  }, [list]);

  // Ready when every poster has fired onLoad — with a 4s grace so one slow
  // image can't hold the buttons hostage forever.
  useEffect(() => {
    if (settled >= remoteImages) setReady(true);
  }, [settled, remoteImages]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Polaroid settle-in for the preview.
  const rotate = useSharedValue(-3);
  useEffect(() => {
    rotate.value = withSpring(0, springs.gentle);
  }, [rotate]);
  const previewStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotate.value}deg` }],
  }));

  if (!list) {
    return <View style={styles.root} />;
  }

  const capture = async (): Promise<string | null> => {
    try {
      return await captureRef(canvasRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch {
      toast('Could not render the image. Try again.');
      return null;
    }
  };

  const celebrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfettiNonce((n) => n + 1);
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    const uri = await capture();
    if (uri) {
      celebrate();
      await Sharing.shareAsync(uri, { mimeType: 'image/png' }).catch(() => {});
    }
    setBusy(false);
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      toast('Photo access needed to save. Enable it in Settings.');
      setBusy(false);
      return;
    }
    const uri = await capture();
    if (uri) {
      await MediaLibrary.saveToLibraryAsync(uri)
        .then(() => {
          celebrate();
          toast('Saved to your photos ✨');
        })
        .catch(() => toast('Save failed. Try again.'));
    }
    setBusy(false);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Export</Text>
        <PressableScale onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Text style={styles.closeText}>✕</Text>
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.springify().damping(15).stiffness(180)}
          style={[previewStyle, styles.previewShadow]}
        >
          <View ref={canvasRef} collapsable={false}>
            <ExportCanvas
              list={list}
              width={CANVAS_W}
              onImageSettled={() => setSettled((n) => n + 1)}
            />
          </View>
        </Animated.View>
        {!ready ? <Text style={styles.loadingNote}>Waiting for artwork…</Text> : null}
      </ScrollView>

      <ConfettiBurst nonce={confettiNonce} />

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PressableScale
          onPress={handleSave}
          style={[styles.secondaryBtn, (!ready || busy) && styles.btnDisabled]}
          disabled={!ready || busy}
        >
          <Text style={styles.secondaryText}>Save to Photos</Text>
        </PressableScale>
        <PressableScale
          onPress={handleShare}
          disabled={!ready || busy}
          style={[{ flex: 1 }, (!ready || busy) && styles.btnDisabled]}
        >
          <LinearGradient
            colors={[colors.brandA, colors.brandB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryText}>{busy ? 'Working…' : 'Share'}</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07070B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: type.title,
    color: colors.textHi,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.textHi, fontSize: 15 },
  scrollBody: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingBottom: 40,
  },
  previewShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  loadingNote: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textLow,
    marginTop: spacing.md,
  },
  confettiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.45 },
  secondaryBtn: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: colors.textHi,
  },
  primaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: '#FFF',
  },
});
