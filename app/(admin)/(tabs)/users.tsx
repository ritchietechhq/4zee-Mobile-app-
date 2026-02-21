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
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminKYCStatistics } from '@/types/admin';

export default function UsersHub() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [kycStats, setKycStats] = useState<AdminKYCStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const stats = await adminService.getKYCStatistics();
      setKycStats(stats);
    } catch (e) {
      console.error('Users hub error:', e);
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
        <Text style={styles.headerTitle}>Users & KYC</Text>
        <Text style={styles.headerSubtitle}>User management and identity verification</Text>

        {/* ─── KYC Statistics ─── */}
        <Text style={styles.sectionTitle}>KYC Overview</Text>
        {isLoading ? (
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="47%" height={80} />)}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {[
              { label: 'Pending', value: kycStats?.byStatus?.PENDING ?? 0, color: colors.warning, bg: colors.warningLight },
              { label: 'Approved', value: kycStats?.byStatus?.APPROVED ?? 0, color: colors.success, bg: colors.successLight },
              { label: 'Rejected', value: kycStats?.byStatus?.REJECTED ?? 0, color: colors.error, bg: colors.errorLight },
              { label: 'Last 24h', value: kycStats?.submissionsLast24h ?? 0, color: colors.primary, bg: colors.primaryLight },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { borderLeftColor: stat.color }]}>
                <View style={[styles.statDot, { backgroundColor: stat.bg }]}>
                  <View style={[styles.statDotInner, { backgroundColor: stat.color }]} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── Navigation ─── */}
        <Text style={styles.sectionTitle}>Actions</Text>
        {[
          {
            title: 'KYC Verification',
            subtitle: 'Review pending documents',
            icon: 'shield-checkmark-outline',
            color: colors.warning,
            bg: colors.warningLight,
            route: '/(admin)/kyc-review',
            badge: kycStats?.byStatus?.PENDING ?? 0,
          },
          {
            title: 'Create User',
            subtitle: 'Add admin, realtor or client',
            icon: 'person-add-outline',
            color: colors.primary,
            bg: colors.primaryLight,
            route: '/(admin)/create-user',
          },
        ].map((item) => (
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
            {(item as any).badge > 0 && (
              <View style={[styles.navBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.navBadgeText}>{(item as any).badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* ─── User Management ─── */}
        <Text style={styles.sectionTitle}>User Management</Text>
        {[
              {
                title: 'All Users',
                subtitle: 'View & manage all user accounts',
                icon: 'people-outline',
                color: colors.error,
                bg: colors.errorLight,
                route: '/(admin)/sa-users',
              },
              {
                title: 'Admin Accounts',
                subtitle: 'View admin & super admin users',
                icon: 'shield-outline',
                color: colors.warning,
                bg: colors.warningLight,
                route: '/(admin)/sa-admins',
              },
              {
                title: 'System Statistics',
                subtitle: 'User analytics & registration trends',
                icon: 'stats-chart-outline',
                color: colors.primary,
                bg: colors.primaryLight,
                route: '/(admin)/sa-stats',
              },
              {
                title: 'All Realtors',
                subtitle: 'Browse & filter realtor accounts',
                icon: 'briefcase-outline',
                color: colors.teal,
                bg: colors.tealLight,
                route: '/(admin)/sa-realtors',
              },
              {
                title: 'All Clients',
                subtitle: 'Browse & filter client accounts',
                icon: 'person-outline',
                color: colors.indigo,
                bg: colors.indigoLight,
                route: '/(admin)/sa-clients',
              },
            ].map((item) => (
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

        {/* ─── KYC Breakdown ─── */}
        {kycStats && (
          <>
            <Text style={styles.sectionTitle}>KYC Breakdown</Text>
            <Card variant="elevated" padding="lg">
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownHeader}>Clients</Text>
                <View style={styles.breakdownRow}>
                  {Object.entries(kycStats.clients ?? {}).map(([status, count]) => (
                    <View key={status} style={styles.breakdownItem}>
                      <Text style={styles.breakdownValue}>{count as number}</Text>
                      <Text style={styles.breakdownLabel}>{status}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownHeader}>Realtors</Text>
                <View style={styles.breakdownRow}>
                  {Object.entries(kycStats.realtors ?? {}).map(([status, count]) => (
                    <View key={status} style={styles.breakdownItem}>
                      <Text style={styles.breakdownValue}>{count as number}</Text>
                      <Text style={styles.breakdownLabel}>{status}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </>
        )}
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
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    statCard: {
      width: '47%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderLeftWidth: 3,
      ...Shadows.sm,
    },
    statDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    statDotInner: { width: 10, height: 10, borderRadius: 5 },
    statValue: { ...Typography.h3, color: colors.textPrimary },
    statLabel: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
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
    navBadge: {
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      marginRight: Spacing.sm,
    },
    navBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
    breakdownSection: { paddingVertical: Spacing.sm },
    breakdownHeader: { ...Typography.captionMedium, color: colors.textSecondary, marginBottom: Spacing.sm },
    breakdownRow: { flexDirection: 'row', gap: Spacing.xl },
    breakdownItem: { alignItems: 'center' },
    breakdownValue: { ...Typography.h4, color: colors.textPrimary },
    breakdownLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    divider: { height: 1, marginVertical: Spacing.md },
  });
