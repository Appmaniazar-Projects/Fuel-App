import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useColors, Spacing, BorderRadius, FontSizes, FontWeights } from '@/lib/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function AppInput({
  label,
  error,
  leftIcon,
  rightElement,
  containerStyle,
  style,
  ...props
}: AppInputProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.inputBorderFocus
                : colors.inputBorder,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftElement}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithIcon : null,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  leftElement: {
    paddingLeft: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElement: {
    paddingRight: Spacing.md,
  },
  error: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
});
