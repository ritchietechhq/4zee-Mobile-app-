import React, { useMemo } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const colors = useThemeColors();

  const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.borderLight, text: colors.textSecondary },
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    error: { bg: colors.errorLight, text: colors.error },
    info: { bg: colors.primaryLight, text: colors.primary },
  };

  const variantColors = VARIANT_COLORS[variant];

  const containerStyle: ViewStyle = {
    backgroundColor: variantColors.bg,
    paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
    paddingVertical: size === 'sm' ? 2 : Spacing.xs,
    borderRadius: BorderRadius.full,
  };

  const textStyle: TextStyle = {
    ...(size === 'sm' ? Typography.small : Typography.captionMedium),
    color: variantColors.text,
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

export default Badge;
