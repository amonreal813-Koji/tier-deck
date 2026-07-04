import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { useToast } from '@/components/Toast';
import type { TierList } from '@/data/types';
import { EmptyState } from '@/features/home/EmptyState';
import { FAB } from '@/features/home/FAB';
import { ListCard } from '@/features/home/ListCard';
import { useListsStore } from '@/store/useListsStore';
import { colors, fonts, spacing, type } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lists = useListsStore((s) => s.lists);
  const deleteList = useListsStore((s) => s.deleteList);
  const duplicateList = useListsStore((s) => s.duplicateList);
  const upsertList = useListsStore((s) => s.upsertList);
  const toast = useToast((s) => s.show);

  const [sheetFor, setSheetFor] = useState<TierList | null>(null);
  // Keeps the deleted list alive for the undo window.
  const lastDeleted = useRef<TierList | null>(null);

  const sorted = Object.values(lists).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDelete = (list: TierList) => {
    lastDeleted.current = list;
    deleteList(list.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    toast(`Deleted "${list.title}"`, {
      actionLabel: 'Undo',
      durationMs: 5000,
      onAction: () => {
        const revived = lastDeleted.current;
        if (revived) {
          upsertList(revived);
          lastDeleted.current = null;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    });
  };

  return (
    <View style={styles.root}>
      <AnimatedGradientBg />
      <FlatList
        data={sorted}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: 140,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Tier Deck</Text>
            <Text style={styles.tagline}>Rank absolutely everything.</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item, index }) => (
          <ListCard
            list={item}
            index={index}
            onPress={() => router.push(`/board/${item.id}`)}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSheetFor(item);
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      <FAB onPress={() => router.push('/create/category')} />
      <ActionSheet
        visible={sheetFor != null}
        title={sheetFor?.title}
        onClose={() => setSheetFor(null)}
        actions={
          sheetFor
            ? [
                {
                  label: 'Duplicate',
                  icon: '📄',
                  onPress: () => {
                    const copy = duplicateList(sheetFor.id);
                    if (copy) toast(`Duplicated as "${copy.title}"`);
                  },
                },
                {
                  label: 'Export as image',
                  icon: '📤',
                  onPress: () => router.push(`/export/${sheetFor.id}`),
                },
                {
                  label: 'Delete',
                  icon: '🗑️',
                  destructive: true,
                  onPress: () => handleDelete(sheetFor),
                },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { marginBottom: spacing.xl },
  title: {
    fontFamily: fonts.display,
    fontSize: type.display,
    color: colors.textHi,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.textMid,
    marginTop: 4,
  },
});
