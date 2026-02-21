import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  route: string;
}

export default function ManageHub() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const items: MenuItem[] = [
    {
      title: 'Properties',
      subtitle: 'Create, edit & manage listings',
      icon: 'business-outline',
      color: colors.primary,
      bg: colors.primaryLight,
      route: '/(admin)/properties',
    },
    {
      title: 'Applications',
      subtitle: 'Review, approve & reject',
      icon: 'document-text-outline',
      color: colors.teal,
      bg: colors.tealLight,
      route: '/(admin)/applications',
    },
    {
      title: 'Sales',
      subtitle: 'View sales & record offline',
      icon: 'cart-outline',
      color: colors.success,
      bg: colors.successLight,
      route: '/(admin)/sales',
    },
    {
      title: 'Payment Plans',
      subtitle: 'Templates, enrollments & overdue',
      icon: 'calendar-outline',
      color: colors.purple,
      bg: colors.purpleLight,
      route: '/(admin)/payment-plans',
    },
    {
      title: 'Documents',
      subtitle: 'Templates & generated documents',
      icon: 'folder-open-outline',
      color: colors.orange,
      bg: colors.orangeLight,
      route: '/(admin)/documents',
    },
    {
      title: 'Referrals',
      subtitle: 'Referral links & conversions',
      icon: 'link-outline',
      color: colors.indigo,
      bg: colors.indigoLight,
      route: '/(admin)/referrals',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Management</Text>
        <Text style={styles.headerSubtitle}>Properties, applications, sales & more</Text>

        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={26} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <View style={styles.arrowWrap}>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 30 },
    headerTitle: { ...Typography.h2, color: colors.textPrimary },
    headerSubtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: Spacing.xxl,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    card: {
      width: '47.5%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    cardTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    cardSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    arrowWrap: {
      position: 'absolute',
      top: Spacing.lg,
      right: Spacing.lg,
    },
  });
