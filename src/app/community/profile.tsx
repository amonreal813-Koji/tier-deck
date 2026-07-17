import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { PressableScale } from '@/components/PressableScale';
import { useToast } from '@/components/Toast';
import { AVATAR_OPTIONS } from '@/data/avatars';
import { fetchMyProfile, isNameAvailable, updateProfile } from '@/data/community';
import { useAuth } from '@/store/useAuth';
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
  const checkRef = useRef(0);

  // Google photo first (if any), then the curated set — de-duplicated.
  const options = useMemo(() => {
    const list = googlePhoto ? [googlePhoto, ...AVATAR_OPTIONS] : AVATAR_OPTIONS;
    return Array.from(new Set(list));
  }, [googlePhoto]);

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
  }, []);

  // Validate + check availability as the user types (debounced).
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
      if (token !== checkRef.current) return; // superseded
      setNameState(free ? { status: 'ok' } : { status: 'error', message: 'That name is already taken.' });
    }, 400);
    return () => clearTimeout(t);
  }, [name, initialName]);

  const nameChanged = name.trim() !== initialName;
  const avatarChanged = avatar !== initialAvatar;
  const canSave =
    !saving &&
    (nameChanged || avatarChanged) &&
    nameState.status !== 'checking' &&
    nameState.status !== 'error';

  const save = async () => {
    if (saving) return;
    const patch: { display_name?: string; avatar_url?: string } = {};
    if (nameChanged) patch.display_name = name.trim();
    if (avatarChanged && avatar) patch.avatar_url = avatar;
    if (Object.keys(patch).length === 0) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await updateProfile(patch);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Profile updated ✨');
      router.back();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save. Try again.');
      setSaving(false);
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

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </PressableScale>
        <Text style={styles.kicker}>Edit profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={styles.preview}>
            <Avatar url={avatar} name={name} size={88} />
          </View>

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

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Picture</Text>
          <View style={styles.grid}>
            {options.map((opt) => {
              const active = avatar === opt;
              return (
                <PressableScale
                  key={opt}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAvatar(opt);
                  }}
                  style={[styles.avatarWrap, active && styles.avatarWrapOn]}
                >
                  <Avatar url={opt} name={name} size={60} />
                </PressableScale>
              );
            })}
          </View>

          <PressableScale onPress={doSignOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </PressableScale>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PressableScale onPress={save} disabled={!canSave} style={[{ width: '100%' }, !canSave && { opacity: 0.5 }]}>
          <LinearGradient
            colors={[colors.brandA, colors.brandB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
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
  preview: { alignItems: 'center', marginVertical: spacing.lg },
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
  signOut: {
    marginTop: spacing.xl, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill, borderWidth: 1, borderColor: withAlpha('#FF3B6B', 0.4), backgroundColor: withAlpha('#FF3B6B', 0.1),
  },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: type.caption, color: '#FF8FA8' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    backgroundColor: 'rgba(7,7,11,0.9)', borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  saveBtn: {
    height: 52, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', maxWidth: 560, width: '100%',
  },
  saveText: { fontFamily: fonts.bodySemiBold, fontSize: type.body, color: '#FFF' },
});
