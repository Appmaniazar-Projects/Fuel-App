import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors, Spacing, FontSizes } from '@/lib/theme';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export function LoadingState({ message = 'Loading...', style }: LoadingStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  message: {
    marginTop: Spacing.lg,
    fontSize: FontSizes.md,
  },
});
