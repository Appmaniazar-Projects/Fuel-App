import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Button } from './Button';
import { useColors, Spacing, FontSizes, FontWeights } from '@/lib/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {!!message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
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
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.xl,
  },
});
