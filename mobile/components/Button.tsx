import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colors = useColors();

  const variantStyles = {
    primary: {
      bg: colors.primary,
      text: colors.textInverse,
      border: colors.primary,
    },
    secondary: {
      bg: colors.secondaryLight,
      text: colors.text,
      border: colors.secondaryLight,
    },
    outline: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: 'transparent',
    },
  };

  const sizeStyles = {
    small: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, fontSize: FontSizes.sm },
    medium: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, fontSize: FontSizes.md },
    large: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, fontSize: FontSizes.lg },
  };

  const current = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={current.text} size="small" />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: current.text, fontSize: sizeStyle.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  outline: {
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: FontWeights.semibold,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
});
