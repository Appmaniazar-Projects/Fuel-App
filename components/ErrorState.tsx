import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from './Button';
import { useColors, Spacing, FontSizes, FontWeights } from '@/lib/theme';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({ message, onRetry, style }: ErrorStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <AlertCircle size={48} color={colors.error} />
      <Text style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
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
  message: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: FontSizes.md,
    textAlign: 'center',
    fontWeight: FontWeights.medium,
  },
  button: {
    marginTop: Spacing.md,
  },
});
