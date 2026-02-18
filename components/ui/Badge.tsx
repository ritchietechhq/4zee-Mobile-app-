import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.borderLight, text: Colors.textSecondary },
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  error: { bg: Colors.errorLight, text: Colors.error },
  info: { bg: Colors.primaryLight, text: Colors.primary },
};

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const colors = VARIANT_COLORS[variant];

  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg,
    paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
    paddingVertical: size === 'sm' ? 2 : Spacing.xs,
    borderRadius: BorderRadius.full,
  };

  const textStyle: TextStyle = {
    ...(size === 'sm' ? Typography.small : Typography.captionMedium),
    color: colors.text,
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

export default Badge;
