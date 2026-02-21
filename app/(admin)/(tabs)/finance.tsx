import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatCompactNumber } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { SalesMetrics, CommissionRates } from '@/types/admin';

export default function FinanceHub() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [rates, setRates] = useState<CommissionRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([
        adminService.getSalesMetrics(),
        adminService.getCommissionRates(),
      ]);
      setMetrics(m);
      setRates(r);
    } catch (e) {
      console.error('Finance hub error:', e);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const nav = [
    {
      title: 'Commissions',
      subtitle: 'View, approve & manage',
      icon: 'trophy-outline',
      color: colors.warning,
      bg: colors.warningLight,
      route: '/(admin)/commissions',
    },
    {
      title: 'Commission Rates',
      subtitle: 'Set direct & referral rates',
      icon: 'settings-outline',
      color: colors.purple,
      bg: colors.purpleLight,
      route: '/(admin)/commission-rates',
    },
    {
      title: 'Payouts',
      subtitle: 'Process payout requests',
      icon: 'cash-outline',
      color: colors.success,
      bg: colors.successLight,
      route: '/(admin)/payouts',
    },
    {
      title: 'Analytics',
      subtitle: 'Sales metrics & leaderboard',
      icon: 'bar-chart-outline',
      color: colors.primary,
      bg: colors.primaryLight,
      route: '/(admin)/analytics',
    },
    {
      title: 'Reports',
      subtitle: 'Executive overview & exports',
      icon: 'document-attach-outline',
      color: colors.teal,
      bg: colors.tealLight,
      route: '/(admin)/reports',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.headerTitle}>Finance</Text>
        <Text style={styles.headerSubtitle}>Commissions, payouts & analytics</Text>

        {/* ─── Summary Cards ─── */}
        {isLoading ? (
          <View style={styles.summaryRow}>
            <Skeleton width="48%" height={100} />
            <Skeleton width="48%" height={100} />
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <Card variant="elevated" padding="lg" style={styles.summaryCard}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {formatCompactNumber(metrics?.totalAmount ?? 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryMeta}>{metrics?.count ?? 0} transactions</Text>
            </Card>
            <Card variant="elevated" padding="lg" style={styles.summaryCard}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {((rates?.directRate ?? 0) * 100).toFixed(1)}%
              </Text>
              <Text style={styles.summaryLabel}>Direct Rate</Text>
              <Text style={styles.summaryMeta}>
                Referral: {((rates?.referralRate ?? 0) * 100).toFixed(1)}%
              </Text>
            </Card>
          </View>
        )}

        {/* ─── Navigation Grid ─── */}
        {nav.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.navRow}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.navIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={styles.navText}>
              <Text style={styles.navTitle}>{item.title}</Text>
              <Text style={styles.navSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
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
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xxl,
    },
    summaryCard: { flex: 1 },
    summaryValue: { ...Typography.h2, marginTop: Spacing.sm },
    summaryLabel: { ...Typography.captionMedium, color: colors.textSecondary, marginTop: 4 },
    summaryMeta: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    navIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navText: { flex: 1, marginLeft: Spacing.lg },
    navTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
    navSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  });
