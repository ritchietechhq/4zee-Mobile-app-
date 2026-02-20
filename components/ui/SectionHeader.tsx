import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  const { colors } = useTheme();
  
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[dynamicStyles.container, style]}>
      <Text style={dynamicStyles.title}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={dynamicStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Text style={dynamicStyles.action}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      ...Typography.h4,
      color: colors.textPrimary,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    action: {
      ...Typography.captionMedium,
      color: colors.primary,
    },
  });

export default SectionHeader;
