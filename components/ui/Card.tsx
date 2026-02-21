import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof Spacing;
  children: React.ReactNode;
}

export function Card({
  variant = 'elevated',
  padding = 'lg',
  children,
  style,
  ...rest
}: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const cardStyle: ViewStyle[] = [
    styles.base,
    { padding: Spacing[padding] },
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'filled' && styles.filled,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.cardBackground,
  },
  elevated: {
    ...Shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.surface,
  },
});

export default Card;
