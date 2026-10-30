import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/lib/theme';

interface BenchmarkBadgeProps {
  status: 'green' | 'amber' | 'red';
  percentage: number;
  label: string;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

export function BenchmarkBadge({ status, percentage, label, style, size = 'medium' }: BenchmarkBadgeProps) {
  const colors = useColors();

  const statusColors = {
    green: { bg: colors.successLight, text: colors.success },
    amber: { bg: colors.warningLight, text: colors.warning },
    red: { bg: colors.errorLight, text: colors.error },
  };

  const sizeStyles = {
    small: { padding: 4, fontSize: 10, borderRadius: 4 },
    medium: { padding: 6, fontSize: 12, borderRadius: 6 },
    large: { padding: Spacing.sm, fontSize: 14, borderRadius: 8 },
  };

  const current = statusColors[status];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderRadius: sizeStyle.borderRadius,
          padding: sizeStyle.padding,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.percentage,
          { color: current.text, fontSize: sizeStyle.fontSize },
        ]}
      >
        {percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%
      </Text>
      <Text
        style={[
          styles.label,
          { color: current.text },
        ]}
      >
        {' '}{label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  percentage: {
    fontWeight: FontWeights.bold,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
});
