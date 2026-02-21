import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  style?: ViewStyle;
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  trend,
  style,
}: AnalyticsCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedIconBackground = iconBackground ?? colors.primaryLight;

  return (
    <Card variant="elevated" padding="lg" style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: resolvedIconBackground }]}>
          <Ionicons name={icon} size={18} color={resolvedIconColor} />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.isPositive ? colors.successLight : colors.errorLight },
            ]}
          >
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.isPositive ? colors.success : colors.error },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trendText: {
    ...Typography.small,
    fontWeight: '600',
  },
  value: {
    ...Typography.h3,
    color: colors.textPrimary,
  },
  title: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default AnalyticsCard;
