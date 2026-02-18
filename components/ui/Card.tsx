import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

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

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cardBackground,
  },
  elevated: {
    ...Shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filled: {
    backgroundColor: Colors.surface,
  },
});

export default Card;
