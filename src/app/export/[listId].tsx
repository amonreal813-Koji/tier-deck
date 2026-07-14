import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import { ConfettiBurst } from '@/components/Confetti';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { ExportCanvas } from '@/features/export/ExportCanvas';
import { useListsStore } from '@/store/useListsStore';
import { colors, fonts, radii, spacing, springs, type } from '@/theme/tokens';
import { buildShareUrl } from '@/utils/share';

const SCREEN_W = Dimensions.get('window').width;
const CANVAS_W = Math.min(SCREEN_W - spacing.lg * 2, 400);

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
      // Lazy require: view-shot is native-only and breaks web at import time.
      const { captureRef } = require('react-native-view-shot') as typeof import('react-native-view-shot');
      return await captureRef(canvasRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch {
      toast('Could not render the image. Try again.');
      return null;
    }
  };

  // Web capture: rasterize the canvas DOM node to a PNG data URL. react-native-web
  // forwards the View ref to its underlying <div>, so canvasRef.current is a real
  // HTMLElement here. Runs at 2x for a crisp, share-ready image.
  const captureWebDataUrl = async (): Promise<string | null> => {
    try {
      const node = canvasRef.current as unknown as HTMLElement | null;
      if (!node) return null;
      const { toPng } = require('html-to-image') as typeof import('html-to-image');
      return await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: colors.bg,
      });
    } catch {
      toast('Could not render the image. Try again.');
      return null;
    }
  };

  const celebrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfettiNonce((n) => n + 1);
  };

  const isWeb = Platform.OS === 'web';

  const handleCopyLink = async () => {
    const url = buildShareUrl(list);
    if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        celebrate();
        toast('Share link copied ✨');
      } catch {
        toast('Copy failed — long-press the address bar instead.');
      }
      return;
    }
    // Native: hand the link to the OS share sheet.
    try {
      const { Share } = require('react-native') as typeof import('react-native');
      await Share.share({ message: url });
    } catch {
      toast('Could not open share sheet.');
    }
  };

  // Web download: build the PNG, then hand it to the browser as a file download.
  const handleDownload = async () => {
    if (busy || !ready) return;
    setBusy(true);
    const dataUrl = await captureWebDataUrl();
    if (dataUrl) {
      const slug = (list.title || 'tier-list')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${slug || 'tier-list'}-tier-deck.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      celebrate();
      toast('Image downloaded ✨');
    }
    setBusy(false);
  };

  const handleShare = async () => {
    if (busy || isWeb) return;
    setBusy(true);
    const uri = await capture();
    if (uri) {
      celebrate();
      const Sharing = require('expo-sharing') as typeof import('expo-sharing');
      await Sharing.shareAsync(uri, { mimeType: 'image/png' }).catch(() => {});
    }
    setBusy(false);
  };

  const handleSave = async () => {
    if (busy || isWeb) return;
    setBusy(true);
    const MediaLibrary = require('expo-media-library') as typeof import('expo-media-library');
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
        {isWeb ? (
          <>
            <PressableScale onPress={handleCopyLink} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Copy link</Text>
            </PressableScale>
            <PressableScale
              onPress={handleDownload}
              disabled={!ready || busy}
              style={[{ flex: 1 }, (!ready || busy) && styles.btnDisabled]}
            >
              <LinearGradient
                colors={[colors.brandA, colors.brandB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryText}>
                  {busy ? 'Rendering…' : 'Download PNG'}
                </Text>
              </LinearGradient>
            </PressableScale>
          </>
        ) : (
          <>
            <PressableScale
              onPress={handleCopyLink}
              style={[styles.secondaryBtn, busy && styles.btnDisabled]}
              disabled={busy}
            >
              <Text style={styles.secondaryText}>Copy link</Text>
            </PressableScale>
            <PressableScale
              onPress={handleSave}
              style={[styles.secondaryBtn, (!ready || busy) && styles.btnDisabled]}
              disabled={!ready || busy}
            >
              <Text style={styles.secondaryText}>Save</Text>
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
          </>
        )}
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.45 },
  webNote: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMid,
    paddingVertical: spacing.md,
  },
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
