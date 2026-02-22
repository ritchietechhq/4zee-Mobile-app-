import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatCompactNumber } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminDashboard as AdminDashboardData, AdminQuickStats, AdminKYCStatistics } from '@/types/admin';

const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  CREATE: { icon: 'add-circle-outline', color: '#16A34A' },
  UPDATE: { icon: 'create-outline', color: '#3B82F6' },
  DELETE: { icon: 'trash-outline', color: '#DC2626' },
  APPROVE: { icon: 'checkmark-circle-outline', color: '#16A34A' },
  REJECT: { icon: 'close-circle-outline', color: '#DC2626' },
  PAYMENT: { icon: 'card-outline', color: '#8B5CF6' },
  LOGIN: { icon: 'log-in-outline', color: '#0D9488' },
  VIEW: { icon: 'eye-outline', color: '#6B7280' },
};

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [quickStats, setQuickStats] = useState<AdminQuickStats | null>(null);
  const [kycStats, setKycStats] = useState<AdminKYCStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const fetchData = useCallback(async () => {
    try {
      // Fetch dashboard + quick-stats + live KYC statistics in parallel
      const [dash, stats, kyc] = await Promise.all([
        adminService.getDashboard().catch(() => null),
        adminService.getQuickStats().catch(() => null),
        adminService.getKYCStatistics().catch(() => null),
      ]);

      // Merge live KYC counts into the dashboard pending actions
      // so they always reflect the real DB state, not cached aggregates
      if (dash && kyc) {
        const livePending = (kyc.byStatus?.PENDING ?? 0);
        const docPending  = kyc.documents?.pending ?? livePending;
        dash.pendingActions = {
          ...dash.pendingActions,
          kycPending: docPending || livePending,
        };
      }

      // Merge live KYC count into quick-stats too
      if (stats && kyc) {
        const livePending = kyc.documents?.pending ?? (kyc.byStatus?.PENDING ?? 0);
        stats.pendingKyc = livePending;
      }

      setDashboard(dash);
      setQuickStats(stats);
      setKycStats(kyc);
    } catch (e) {
      console.error('Admin dashboard fetch error:', e);
    }
  }, []);

  const hasFetchedRef = useRef(false);

  // Refresh data every time dashboard gains focus (not just on mount)
  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedRef.current) {
        // First visit — show full skeleton + fade-in
        hasFetchedRef.current = true;
        (async () => {
          await fetchData();
          setIsLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        })();
      } else {
        // Subsequent focuses — silent refresh (no skeleton flash)
        fetchData();
      }
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ─── Render helpers ───
  const renderSkeleton = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerSkeleton}>
        <Skeleton width={200} height={24} />
        <Skeleton width={140} height={16} style={{ marginTop: 8 }} />
      </View>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={100} style={{ marginBottom: 16 }} />
      ))}
    </ScrollView>
  );

  if (isLoading) return <SafeAreaView style={styles.safe}>{renderSkeleton()}</SafeAreaView>;

  const ov = dashboard?.overview;
  const fin = dashboard?.financials;
  const apps = dashboard?.applications;
  const pending = dashboard?.pendingActions;
  const activity = dashboard?.recentActivity ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ─── */}
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>
                  {user?.firstName || 'Admin'} 👋
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(admin)/activity-logs' as any)}
                style={styles.headerIconBtn}
              >
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {(quickStats?.unreadNotifications ?? 0) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {quickStats!.unreadNotifications > 9 ? '9+' : quickStats!.unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick stat pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickStatRow}
            >
              {[
                { label: 'Pending KYC', value: quickStats?.pendingKyc ?? 0, icon: 'shield-outline', route: '/(admin)/kyc-review' },
                { label: 'Pending Payouts', value: quickStats?.pendingPayouts ?? 0, icon: 'cash-outline', route: '/(admin)/payouts' },
                { label: 'Open Tickets', value: quickStats?.openTickets ?? 0, icon: 'chatbubble-outline', route: '/(admin)/support-tickets' },
                { label: 'Messages', value: quickStats?.unreadMessages ?? 0, icon: 'mail-outline', route: '' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.quickStatPill}
                  onPress={() => item.route && router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon as any} size={16} color={colors.primary} />
                  <Text style={styles.quickStatValue}>{item.value}</Text>
                  <Text style={styles.quickStatLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>

          {/* ─── Platform Overview KPIs ─── */}
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.kpiGrid}>
            {[
              { label: 'Total Users', value: ov?.totalUsers ?? 0, icon: 'people', color: colors.primary, bg: colors.primaryLight },
              { label: 'Properties', value: ov?.totalProperties ?? 0, icon: 'business', color: colors.teal, bg: colors.tealLight },
              { label: 'Applications', value: apps?.total ?? 0, icon: 'document-text', color: colors.purple, bg: colors.purpleLight },
              { label: 'Sales', value: fin?.completedSales ?? 0, icon: 'cart', color: colors.success, bg: colors.successLight },
            ].map((kpi) => (
              <View key={kpi.label} style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: kpi.bg }]}>
                  <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
                </View>
                <Text style={styles.kpiValue}>{kpi.value.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          {/* ─── Financial Summary ─── */}
          <Text style={styles.sectionTitle}>Financials</Text>
          <Card variant="elevated" padding="lg" style={styles.finCard}>
            <View style={styles.finRow}>
              <View style={styles.finItem}>
                <Text style={styles.finLabel}>Total Sales Value</Text>
                <Text style={[styles.finValue, { color: colors.success }]}>
                  {formatCompactNumber(fin?.totalSalesValue ?? 0)}
                </Text>
              </View>
              <View style={[styles.finDivider, { backgroundColor: colors.border }]} />
              <View style={styles.finItem}>
                <Text style={styles.finLabel}>Payments Received</Text>
                <Text style={[styles.finValue, { color: colors.primary }]}>
                  {formatCompactNumber(fin?.totalPaymentsReceived ?? 0)}
                </Text>
              </View>
            </View>
          </Card>

          {/* ─── Pending Actions ─── */}
          <Text style={styles.sectionTitle}>Pending Actions</Text>
          <View style={styles.pendingGrid}>
            <TouchableOpacity
              style={[styles.pendingCard, { borderLeftColor: colors.warning }]}
              onPress={() => router.push('/(admin)/kyc-review' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.pendingIconWrap, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="shield-half-outline" size={22} color={colors.warning} />
              </View>
              <Text style={styles.pendingValue}>{pending?.kycPending ?? 0}</Text>
              <Text style={styles.pendingLabel}>KYC Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pendingCard, { borderLeftColor: colors.purple }]}
              onPress={() => router.push('/(admin)/payouts' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.pendingIconWrap, { backgroundColor: colors.purpleLight }]}>
                <Ionicons name="cash-outline" size={22} color={colors.purple} />
              </View>
              <Text style={styles.pendingValue}>{pending?.payoutsPending?.count ?? 0}</Text>
              <Text style={styles.pendingLabel}>Payout Requests</Text>
              {(pending?.payoutsPending?.amount ?? 0) > 0 && (
                <Text style={styles.pendingSub}>
                  {formatCurrency(pending!.payoutsPending.amount)}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pendingCard, { borderLeftColor: colors.error }]}
              onPress={() => router.push('/(admin)/support-tickets' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.pendingIconWrap, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="chatbubbles-outline" size={22} color={colors.error} />
              </View>
              <Text style={styles.pendingValue}>{pending?.openSupportTickets ?? 0}</Text>
              <Text style={styles.pendingLabel}>Open Tickets</Text>
            </TouchableOpacity>
          </View>

          {/* ─── KYC Documents Breakdown (live stats) ─── */}
          {kycStats && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(admin)/kyc-review' as any)}
            >
              <Card variant="elevated" padding="md" style={styles.kycBreakdownCard}>
                <View style={styles.kycBreakdownHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                  <Text style={styles.kycBreakdownTitle}>KYC Documents</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
                <View style={styles.kycBreakdownRow}>
                  <View style={styles.kycBreakdownItem}>
                    <View style={[styles.kycDot, { backgroundColor: colors.warning }]} />
                    <Text style={styles.kycBreakdownLabel}>Pending</Text>
                    <Text style={[styles.kycBreakdownCount, { color: colors.warning }]}>
                      {kycStats.documents?.pending ?? kycStats.byStatus?.PENDING ?? 0}
                    </Text>
                  </View>
                  <View style={styles.kycBreakdownItem}>
                    <View style={[styles.kycDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.kycBreakdownLabel}>Approved</Text>
                    <Text style={[styles.kycBreakdownCount, { color: colors.success }]}>
                      {kycStats.documents?.approved ?? kycStats.byStatus?.APPROVED ?? 0}
                    </Text>
                  </View>
                  <View style={styles.kycBreakdownItem}>
                    <View style={[styles.kycDot, { backgroundColor: colors.error }]} />
                    <Text style={styles.kycBreakdownLabel}>Rejected</Text>
                    <Text style={[styles.kycBreakdownCount, { color: colors.error }]}>
                      {kycStats.documents?.rejected ?? kycStats.byStatus?.REJECTED ?? 0}
                    </Text>
                  </View>
                  {(kycStats.submissionsLast24h ?? 0) > 0 && (
                    <View style={styles.kycBreakdownItem}>
                      <View style={[styles.kycDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.kycBreakdownLabel}>Last 24h</Text>
                      <Text style={[styles.kycBreakdownCount, { color: colors.primary }]}>
                        {kycStats.submissionsLast24h}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          )}

          {/* ─── User Breakdown ─── */}
          <Text style={styles.sectionTitle}>User Breakdown</Text>
          <Card variant="elevated" padding="lg">
            {Object.entries(ov?.usersByRole ?? {}).map(([role, count]) => (
              <View key={role} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <Ionicons
                    name={
                      role === 'ADMIN' ? 'shield-checkmark-outline' :
                      role === 'REALTOR' ? 'briefcase-outline' :
                      'person-outline'
                    }
                    size={18}
                    color={
                      role === 'ADMIN' ? colors.error :
                      role === 'REALTOR' ? colors.primary :
                      colors.teal
                    }
                  />
                  <Text style={styles.breakdownLabel}>{role}</Text>
                </View>
                <Text style={styles.breakdownValue}>{(count as number).toLocaleString()}</Text>
              </View>
            ))}
          </Card>

          {/* ─── Application Status Breakdown ─── */}
          <Text style={styles.sectionTitle}>Applications</Text>
          <Card variant="elevated" padding="lg">
            <View style={styles.appStatusRow}>
              {Object.entries(apps?.byStatus ?? {}).map(([status, count]) => {
                const statusColors: Record<string, { bg: string; text: string }> = {
                  PENDING: { bg: colors.warningLight, text: colors.warning },
                  APPROVED: { bg: colors.successLight, text: colors.success },
                  REJECTED: { bg: colors.errorLight, text: colors.error },
                };
                const sc = statusColors[status] ?? { bg: colors.surface, text: colors.textSecondary };
                return (
                  <View key={status} style={[styles.appStatusChip, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.appStatusCount, { color: sc.text }]}>{count as number}</Text>
                    <Text style={[styles.appStatusLabel, { color: sc.text }]}>{status}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* ─── Recent Activity ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/activity-logs' as any)}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <Card variant="elevated" padding="md">
            {activity.length === 0 ? (
              <Text style={styles.emptyText}>No recent activity</Text>
            ) : (
              activity.slice(0, 8).map((item, idx) => {
                const ai = ACTIVITY_ICONS[item.action] ?? ACTIVITY_ICONS.VIEW;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.activityRow,
                      idx < Math.min(activity.length, 8) - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: `${ai!.color}18` }]}>
                      <Ionicons name={ai!.icon as any} size={18} color={ai!.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={styles.activityMeta}>
                        {item.entityType} • {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 20 },

    // Header
    headerGradient: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xxl,
      borderBottomLeftRadius: BorderRadius.xxl,
      borderBottomRightRadius: BorderRadius.xxl,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.lg,
    },
    greeting: { ...Typography.body, color: 'rgba(255,255,255,0.8)' },
    userName: { ...Typography.h2, color: '#fff', marginTop: 2 },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#DC2626',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    headerSkeleton: { padding: Spacing.xl },

    // Quick stat pills
    quickStatRow: { gap: Spacing.sm, paddingRight: Spacing.md },
    quickStatPill: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      minWidth: 90,
    },
    quickStatValue: { ...Typography.h3, color: colors.textPrimary, marginTop: 4 },
    quickStatLabel: { ...Typography.small, color: colors.textSecondary, marginTop: 2 },

    // Section
    sectionTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    viewAll: { ...Typography.captionMedium },

    // KPI Grid
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    kpiCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    },
    kpiIconWrap: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    kpiValue: { ...Typography.h3, color: colors.textPrimary },
    kpiLabel: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },

    // Financials
    finCard: { marginHorizontal: Spacing.xl },
    finRow: { flexDirection: 'row', alignItems: 'center' },
    finItem: { flex: 1, alignItems: 'center' },
    finLabel: { ...Typography.caption, color: colors.textSecondary, marginBottom: 4 },
    finValue: { ...Typography.h3, fontWeight: '700' },
    finDivider: { width: 1, height: 40, marginHorizontal: Spacing.md },

    // Pending Actions
    pendingGrid: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    pendingCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderLeftWidth: 3,
      ...Shadows.sm,
    },
    pendingIconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    pendingValue: { ...Typography.h3, color: colors.textPrimary },
    pendingLabel: { ...Typography.small, color: colors.textSecondary, marginTop: 2 },
    pendingSub: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // KYC Breakdown Card
    kycBreakdownCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.md },
    kycBreakdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    kycBreakdownTitle: { ...Typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    kycBreakdownRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    kycBreakdownItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    kycDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    kycBreakdownLabel: { ...Typography.small, color: colors.textSecondary },
    kycBreakdownCount: { ...Typography.h4, fontWeight: '700' },

    // Breakdown
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    breakdownLabel: { ...Typography.bodyMedium, color: colors.textPrimary },
    breakdownValue: { ...Typography.h4, color: colors.textPrimary },

    // App Status
    appStatusRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    appStatusChip: {
      flex: 1,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    appStatusCount: { ...Typography.h3, fontWeight: '700' },
    appStatusLabel: { ...Typography.small, marginTop: 2 },

    // Activity
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityContent: { flex: 1 },
    activityDesc: { ...Typography.bodyMedium, color: colors.textPrimary },
    activityMeta: { ...Typography.caption, color: colors.textMuted, marginTop: 2 },

    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
  });
