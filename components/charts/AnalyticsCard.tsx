import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

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
  iconColor = Colors.primary,
  iconBackground = Colors.primaryLight,
  trend,
  style,
}: AnalyticsCardProps) {
  return (
    <Card variant="elevated" padding="lg" style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.isPositive ? Colors.successLight : Colors.errorLight },
            ]}
          >
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? Colors.success : Colors.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.isPositive ? Colors.success : Colors.error },
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

const styles = StyleSheet.create({
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
    color: Colors.textPrimary,
  },
  title: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export default AnalyticsCard;
