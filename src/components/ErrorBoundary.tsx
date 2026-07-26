import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AnimatedGradientBg } from '@/components/AnimatedGradientBg';
import { BrandMark } from '@/components/BrandMark';
import { PressableScale } from '@/components/PressableScale';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Top-level safety net: if any screen throws during render, show a branded
 * "something went wrong" screen with a reload instead of a white void. Without
 * this, a single bad component takes down the whole app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Surfaced in the console / crash logs; no third-party reporter wired yet.
    console.error('Tier Deck crashed:', error, info);
  }

  private handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.root}>
        <AnimatedGradientBg />
        <View style={styles.center}>
          <BrandMark />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The board hit a snag. Reloading usually clears it — your saved lists are safe.
          </Text>
          <PressableScale style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonLabel}>Reload</Text>
          </PressableScale>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textHi,
    marginTop: spacing.lg,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMid,
    textAlign: 'center',
    maxWidth: 340,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.brandA,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  buttonLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
});
