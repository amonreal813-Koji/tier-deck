import { Stack } from 'expo-router';
import React from 'react';

import { NotFound } from '@/components/NotFound';

/** Catches any URL that doesn't match a route (bad deep links, typos). */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: 'Not found' }} />
      <NotFound />
    </>
  );
}
