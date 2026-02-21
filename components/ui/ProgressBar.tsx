import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import { formatPercentage } from '@/utils/formatCurrency';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  height = 8,
  color,
  trackColor,
  style,
}: ProgressBarProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resolvedColor = color ?? colors.primary;
  const resolvedTrackColor = trackColor ?? colors.borderLight;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={style}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>{formatPercentage(clampedProgress, 0)}</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: resolvedTrackColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              height,
              backgroundColor: resolvedColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  percentage: {
    ...Typography.captionMedium,
    color: colors.textPrimary,
  },
  track: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});

export default ProgressBar;
