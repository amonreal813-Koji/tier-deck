import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CONTENT_MAX_WIDTH, useLayout } from '@/theme/layout';

/**
 * Centers page content in a max-width column so the app doesn't sprawl into a
 * thin strip on wide desktop screens. Horizontal padding scales with width.
 */
export function ScreenContainer({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { horizontalPadding } = useLayout();
  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.inner,
          { paddingHorizontal: padded ? horizontalPadding : 0 },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', width: '100%' },
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, flex: 1 },
});
