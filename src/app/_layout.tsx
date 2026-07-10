import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { ToastHost } from '@/components/Toast';
import { useListsStore } from '@/store/useListsStore';
import { usePremadeEdits } from '@/store/usePremadeEdits';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const hydrated = useListsStore((s) => s.hydrated);
  const hydrate = useListsStore((s) => s.hydrate);
  const hydrateEdits = usePremadeEdits((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateEdits();
  }, [hydrate, hydrateEdits]);

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="create/category" />
        <Stack.Screen name="create/search" />
        <Stack.Screen name="board/[listId]" />
        <Stack.Screen name="premade/[premadeId]" />
        <Stack.Screen name="import" />
        <Stack.Screen
          name="export/[listId]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <ToastHost />
      <OnboardingOverlay />
    </GestureHandlerRootView>
  );
}
