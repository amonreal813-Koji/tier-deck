import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { AVATAR_EMOJIS, AVATAR_IMAGES } from '@/data/avatars';
import {
  fetchMyProfile,
  fetchMyPublished,
  isNameAvailable,
  unpublishList,
  updateProfile,
  type PublishedList,
} from '@/data/community';
import { useAuth } from '@/store/useAuth';
import { OWNER_ID } from '@/lib/supabase';
import { usePro } from '@/store/usePro';
import { withAlpha } from '@/theme/tierColors';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';
import { NAME_MAX, validateDisplayName } from '@/utils/displayName';

type NameState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  const googlePhoto = (user?.user_metadata?.avatar_url || user?.user_metadata?.picture) as string | undefined;

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [initialName, setInitialName] = useState('');
  const [initialAvatar, setInitialAvatar] = useState<string | null>(null);
  const [nameState, setNameState] = useState<NameState>({ status: 'idle' });
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState<PublishedList[]>([]);
  const checkRef = useRef(0);
  const isPro = usePro((s) => s.isPro);
  const setPro = usePro((s) => s.setPro);
  const isOwner = user?.id === OWNER_ID;

  const imageOptions = useMemo(
    () => (googlePhoto ? [googlePhoto, ...AVATAR_IMAGES] : AVATAR_IMAGES),
    [googlePhoto]
  );

  const stats = useMemo(() => {
    const likes = mine.reduce((n, l) => n + (l.like_count || 0), 0);
    return { lists: mine.length, likes };
  }, [mine]);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (!p) return;
        setName(p.display_name ?? '');
        setInitialName(p.display_name ?? '');
        setAvatar(p.avatar_url ?? null);
        setInitialAvatar(p.avatar_url ?? null);
      })
      .catch(() => {});
    fetchMyPublished().then(setMine).catch(() => {});
  }, []);

  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed === initialName) {
      setNameState({ status: 'idle' });
      return;
    }
    const localErr = validateDisplayName(trimmed);
    if (localErr) {
      setNameState({ status: 'error', message: localErr });
      return;
    }
    setNameState({ status: 'checking' });
    const token = ++checkRef.current;
    const t = setTimeout(async () => {
      const free = await isNameAvailable(trimmed);
      if (token !== checkRef.current) return;
      setNameState(free ? { status: 'ok' } : { status: 'error', message: 'That name is already taken.' });
    }, 400);
    return () => clearTimeout(t);
  }, [name, initialName]);

  const nameChanged = name.trim() !== initialName;
  const avatarChanged = avatar !== initialAvatar;
  const canSave =
    !saving && (nameChanged || avatarChanged) && nameState.status !== 'checking' && nameState.status !== 'error';

  const save = async () => {
    if (saving) return;
    const patch: { display_name?: string; avatar_url?: string } = {};
    if (nameChanged) patch.display_name = name.trim();
    if (avatarChanged && avatar) patch.avatar_url = avatar;
    if (Object.keys(patch).length === 0) return;
    setSaving(true);
    try {
      await updateProfile(patch);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInitialName(name.trim());
      setInitialAvatar(avatar);
      toast('Saved ✨');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save. Try again.');
    }
    setSaving(false);
  };

  const doUnpublish = async (l: PublishedList) => {
    try {
      await unpublishList(l.id);
      setMine((m) => m.filter((x) => x.id !== l.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Removed from community');
    } catch {
      toast('Could not remove. Try again.');
    }
  };

  const doSignOut = async () => {
    await signOut();
    router.replace('/community');
  };

  const hint =
    nameState.status === 'checking'
      ? 'Checking…'
      : nameState.status === 'ok'
        ? '✓ Available'
        : nameState.status === 'error'
          ? nameState.message
          : ' ';

  const AvatarTile = ({ opt }: { opt: string }) => (
    <PressableScale
      onPress={() => {
        Haptics.selectionAsync();
        setAvatar(opt);
      }}
      style={[styles.avatarWrap, avatar === opt && styles.avatarWrapOn]}
    >
      <Avatar url={opt} name={name} size={58} />
    </PressableScale>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))} style={styles.back} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <Text style={styles.kicker}>Your profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Hero */}
          <LinearGradient
            colors={[withAlpha(colors.brandA, 0.28), withAlpha(colors.brandB, 0.14)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Avatar url={avatar} name={name} size={92} />
            <Text style={styles.heroName} numberOfLines={1}>{name || 'Your name'}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}><Text style={styles.statNum}>{stats.lists}</Text> published</Text>
              <View style={styles.statDot} />
              <Text style={styles.stat}><Text style={styles.statNum}>{stats.likes}</Text> likes</Text>
            </View>
          </LinearGradient>

          {/* Name */}
          <Text style={styles.label}>Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textLow}
            style={styles.input}
            autoCorrect={false}
            maxLength={NAME_MAX}
          />
          <Text
            style={[
              styles.hint,
              nameState.status === 'ok' && { color: '#4ADE80' },
              nameState.status === 'error' && { color: '#FF8FA8' },
            ]}
          >
            {hint}
          </Text>

          {/* Avatar picker */}
          <Text style={[styles.label, { marginTop: spacing.lg }]}>Emoji</Text>
          <View style={styles.grid}>
            {AVATAR_EMOJIS.map((opt) => <AvatarTile key={opt} opt={opt} />)}
          </View>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>From our lists</Text>
          <View style={styles.grid}>
            {imageOptions.map((opt) => <AvatarTile key={opt} opt={opt} />)}
          </View>

          {/* Your published lists */}
          {mine.length > 0 ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.xl }]}>Your published lists</Text>
              {mine.map((l) => (
                <View key={l.id} style={styles.myRow}>
                  <PressableScale onPress={() => router.push(`/community/${l.id}`)} style={{ flex: 1 }}>
                    <Text style={styles.myTitle} numberOfLines={1}>{l.title}</Text>
                    <Text style={styles.myMeta}>♥ {l.like_count}</Text>
                  </PressableScale>
                  <PressableScale onPress={() => doUnpublish(l)} hitSlop={8} style={styles.unpub}>
                    <Text style={styles.unpubText}>Remove</Text>
                  </PressableScale>
                </View>
              ))}
            </>
          ) : null}

          {/* Pro — owner-only switch until billing is wired up. */}
          {isOwner ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.xl }]}>Tier Deck Pro</Text>
              <PressableScale
                onPress={() => {
                  Haptics.selectionAsync();
                  setPro(!isPro);
                  toast(isPro ? 'Pro off' : 'Pro on — exports lose the watermark ✨');
                }}
                style={[styles.proRow, isPro && styles.proRowOn]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.proTitle}>{isPro ? '✨ Pro is on' : 'Pro is off'}</Text>
                  <Text style={styles.proSub}>Watermark-free exports</Text>
                </View>
                <Text style={[styles.proToggle, isPro && { color: '#4ADE80' }]}>{isPro ? 'ON' : 'OFF'}</Text>
              </PressableScale>
            </>
          ) : null}

          <PressableScale onPress={doSignOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </PressableScale>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PressableScale onPress={save} disabled={!canSave} style={[{ width: '100%', maxWidth: 560 }, !canSave && { opacity: 0.5 }]}>
          <LinearGradient
            colors={[colors.brandA, colors.brandB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : canSave ? 'Save changes' : 'Saved'}</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.textHi, fontSize: 18 },
  kicker: {
    fontFamily: fonts.bodySemiBold, fontSize: type.micro, letterSpacing: 1.4,
    textTransform: 'uppercase', color: colors.textLow,
  },
  body: { paddingHorizontal: spacing.lg, width: '100%', maxWidth: 560, alignSelf: 'center' },
  hero: {
    alignItems: 'center', gap: 8, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg,
    borderRadius: radii.panel, borderWidth: 1, borderColor: withAlpha(colors.brandA, 0.3),
    marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  heroName: { fontFamily: fonts.display, fontSize: type.title, color: colors.textHi, maxWidth: '100%' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stat: { fontFamily: fonts.body, fontSize: type.caption, color: colors.textMid },
  statNum: { fontFamily: fonts.bodySemiBold, color: colors.textHi },
  statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textLow },
  label: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textMid, marginBottom: spacing.sm },
  input: {
    fontFamily: fonts.bodyMedium, fontSize: type.body + 1, color: colors.textHi,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radii.card,
  },
  hint: { fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textLow, marginTop: 6, minHeight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  avatarWrap: { borderRadius: 32, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  avatarWrapOn: { borderColor: colors.brandA },
  myRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  myTitle: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  myMeta: { fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textLow, marginTop: 2 },
  unpub: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 3, borderRadius: radii.pill,
    backgroundColor: withAlpha('#FF3B6B', 0.12), borderWidth: 1, borderColor: withAlpha('#FF3B6B', 0.4),
  },
  unpubText: { fontFamily: fonts.bodySemiBold, fontSize: type.micro + 1, color: '#FF8FA8' },
  proRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    borderRadius: radii.card, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  proRowOn: { backgroundColor: withAlpha('#4ADE80', 0.1), borderColor: withAlpha('#4ADE80', 0.4) },
  proTitle: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: colors.textHi },
  proSub: { fontFamily: fonts.body, fontSize: type.micro + 1, color: colors.textMid, marginTop: 1 },
  proToggle: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textLow },
  signOut: {
    marginTop: spacing.xl, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface,
  },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: colors.textMid },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    backgroundColor: 'rgba(7,7,11,0.9)', borderTopWidth: 1, borderTopColor: colors.surfaceBorder, alignItems: 'center',
  },
  saveBtn: {
    height: 52, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', width: '100%',
  },
  saveText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
});
