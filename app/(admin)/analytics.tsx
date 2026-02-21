import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterChip } from '@/components/ui/FilterChip';
import { formatCompactNumber } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type {
  AnalyticsDashboard,
  AnalyticsPeriod,
  AnalyticsRevenueChart,
  TopRealtorRanked,
} from '@/types/admin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7 Days' },
  { key: '28d', label: '28 Days' },
  { key: '3m', label: '3 Months' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' },
];

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [period, setPeriod] = useState<AnalyticsPeriod>('28d');
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [revenueChart, setRevenueChart] = useState<AnalyticsRevenueChart | null>(null);
  const [topRealtors, setTopRealtors] = useState<TopRealtorRanked[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const fetchData = useCallback(async (p: AnalyticsPeriod) => {
    try {
      const [dash, revenue, realtors] = await Promise.all([
        adminService.getAnalyticsDashboard(p),
        adminService.getRevenueChart(p),
        adminService.getTopRealtorsRanked(p),
      ]);
      setDashboard(dash);
      setRevenueChart(revenue);
      setTopRealtors(realtors);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData(period).finally(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const onPeriodChange = useCallback(async (p: AnalyticsPeriod) => {
    setPeriod(p);
    setIsRefreshing(true);
    await fetchData(p);
    setIsRefreshing(false);
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(period);
    setIsRefreshing(false);
  }, [fetchData, period]);

  // Simple bar chart renderer
  const renderMiniBar = (data: Array<{ date: string; revenue: number }>) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map((d) => d.revenue), 1);
    const barWidth = Math.max(4, (SCREEN_WIDTH - 80) / data.length - 2);
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.slice(-14).map((d, i) => {
            const height = Math.max(4, (d.revenue / maxVal) * 100);
            return (
              <View
                key={i}
                style={[
                  styles.chartBar,
                  {
                    height,
                    width: barWidth,
                    backgroundColor: d.revenue > 0 ? colors.primary : colors.borderLight,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderSkeleton = () => (
    <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
      <Skeleton width="100%" height={180} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={100} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={200} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={300} />
    </ScrollView>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          renderSkeleton()
        ) : (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {/* Period Selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.periodRow}
              >
                {PERIODS.map((p) => (
                  <FilterChip
                    key={p.key}
                    label={p.label}
                    selected={period === p.key}
                    onPress={() => onPeriodChange(p.key)}
                  />
                ))}
              </ScrollView>

              {/* Revenue Hero */}
              {dashboard && (
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <Text style={styles.heroLabel}>Total Revenue</Text>
                  <Text style={styles.heroValue}>
                    {formatCompactNumber(dashboard.revenue.total)}
                  </Text>
                  <View style={styles.heroRow}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>
                        {dashboard.revenue.salesCount}
                      </Text>
                      <Text style={styles.heroStatLabel}>Sales</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>
                        {dashboard.revenue.salesToday}
                      </Text>
                      <Text style={styles.heroStatLabel}>Today</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>
                        {dashboard.applications.conversionRate.toFixed(1)}%
                      </Text>
                      <Text style={styles.heroStatLabel}>Conversion</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}

              {/* Revenue Chart */}
              {revenueChart && revenueChart.data.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Revenue Trend</Text>
                  <Card variant="elevated" padding="lg">
                    {renderMiniBar(revenueChart.data)}
                    <View style={styles.chartLabelRow}>
                      <Text style={styles.chartLabel}>
                        {revenueChart.data[0]?.date
                          ? new Date(revenueChart.data[0].date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                          : ''}
                      </Text>
                      <Text style={styles.chartLabel}>
                        {revenueChart.data[revenueChart.data.length - 1]?.date
                          ? new Date(revenueChart.data[revenueChart.data.length - 1].date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                          : ''}
                      </Text>
                    </View>
                  </Card>
                </>
              )}

              {/* KPI Grid */}
              {dashboard && (
                <>
                  <Text style={styles.sectionTitle}>Key Metrics</Text>
                  <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, { borderLeftColor: colors.primary }]}>
                      <Ionicons name="people-outline" size={20} color={colors.primary} />
                      <Text style={styles.kpiValue}>{dashboard.users.total.toLocaleString()}</Text>
                      <Text style={styles.kpiLabel}>Total Users</Text>
                      <Text style={styles.kpiSub}>+{dashboard.users.new} new</Text>
                    </View>
                    <View style={[styles.kpiCard, { borderLeftColor: colors.success }]}>
                      <Ionicons name="home-outline" size={20} color={colors.success} />
                      <Text style={styles.kpiValue}>{dashboard.properties.total}</Text>
                      <Text style={styles.kpiLabel}>Properties</Text>
                      <Text style={styles.kpiSub}>{dashboard.properties.available} available</Text>
                    </View>
                    <View style={[styles.kpiCard, { borderLeftColor: colors.warning }]}>
                      <Ionicons name="document-text-outline" size={20} color={colors.warning} />
                      <Text style={styles.kpiValue}>{dashboard.applications.total}</Text>
                      <Text style={styles.kpiLabel}>Applications</Text>
                      <Text style={styles.kpiSub}>{dashboard.applications.pending} pending</Text>
                    </View>
                    <View style={[styles.kpiCard, { borderLeftColor: colors.purple }]}>
                      <Ionicons name="card-outline" size={20} color={colors.purple} />
                      <Text style={styles.kpiValue}>
                        {(dashboard.payments.success + dashboard.payments.pending + dashboard.payments.failed)}
                      </Text>
                      <Text style={styles.kpiLabel}>Payments</Text>
                      <Text style={styles.kpiSub}>{dashboard.payments.failed} failed</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Commissions Summary */}
              {dashboard && (
                <>
                  <Text style={styles.sectionTitle}>Commissions</Text>
                  <Card variant="elevated" padding="lg">
                    <View style={styles.commRow}>
                      {[
                        { label: 'Pending', count: dashboard.commissions.pending.count, amount: dashboard.commissions.pending.amount, color: colors.warning },
                        { label: 'Approved', count: dashboard.commissions.approved.count, amount: dashboard.commissions.approved.amount, color: colors.primary },
                        { label: 'Paid', count: dashboard.commissions.paid.count, amount: dashboard.commissions.paid.amount, color: colors.success },
                      ].map((c) => (
                        <View key={c.label} style={styles.commItem}>
                          <View style={[styles.commDot, { backgroundColor: c.color }]} />
                          <Text style={styles.commCount}>{c.count}</Text>
                          <Text style={styles.commLabel}>{c.label}</Text>
                          <Text style={styles.commAmount}>{formatCompactNumber(c.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </>
              )}

              {/* Payouts & KYC Row */}
              {dashboard && (
                <>
                  <Text style={styles.sectionTitle}>Payouts & KYC</Text>
                  <View style={styles.splitRow}>
                    <Card variant="elevated" padding="lg" style={styles.splitCard}>
                      <Ionicons name="cash-outline" size={22} color={colors.teal} />
                      <Text style={styles.splitTitle}>Payouts</Text>
                      <View style={styles.splitDetail}>
                        <Text style={styles.splitValue}>
                          {dashboard.payouts.pending.count}
                        </Text>
                        <Text style={styles.splitSub}>pending</Text>
                      </View>
                      <Text style={styles.splitAmount}>
                        {formatCompactNumber(dashboard.payouts.pending.amount)}
                      </Text>
                    </Card>
                    <Card variant="elevated" padding="lg" style={styles.splitCard}>
                      <Ionicons name="shield-checkmark-outline" size={22} color={colors.warning} />
                      <Text style={styles.splitTitle}>KYC Pending</Text>
                      <View style={styles.splitDetail}>
                        <Text style={styles.splitValue}>
                          {dashboard.kyc.totalPending}
                        </Text>
                        <Text style={styles.splitSub}>total</Text>
                      </View>
                      <Text style={styles.splitAmount}>
                        {dashboard.kyc.pendingClients}C / {dashboard.kyc.pendingRealtors}R
                      </Text>
                    </Card>
                  </View>
                </>
              )}

              {/* Support & Payment Plans */}
              {dashboard && (
                <View style={styles.splitRow}>
                  <Card variant="elevated" padding="lg" style={styles.splitCard}>
                    <Ionicons name="chatbubbles-outline" size={22} color={colors.error} />
                    <Text style={styles.splitTitle}>Tickets</Text>
                    <Text style={styles.splitValue}>{dashboard.supportTickets.open}</Text>
                    <Text style={styles.splitSub}>open</Text>
                  </Card>
                  <Card variant="elevated" padding="lg" style={styles.splitCard}>
                    <Ionicons name="calendar-outline" size={22} color={colors.indigo} />
                    <Text style={styles.splitTitle}>Payment Plans</Text>
                    <Text style={styles.splitValue}>
                      {dashboard.paymentPlans.activeEnrollments}
                    </Text>
                    <Text style={styles.splitSub}>
                      {dashboard.paymentPlans.overdueInstallments} overdue
                    </Text>
                  </Card>
                </View>
              )}

              {/* Top Realtors */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Realtors</Text>
                <TouchableOpacity onPress={() => router.push('/(admin)/top-realtors' as any)}>
                  <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
              </View>
              {topRealtors.length === 0 ? (
                <Card variant="elevated" padding="lg" style={{ alignItems: 'center' }}>
                  <Ionicons name="podium-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No data for this period</Text>
                </Card>
              ) : (
                topRealtors.slice(0, 5).map((r, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <Card key={r.id} variant="elevated" padding="md" style={styles.realtorCard}>
                      <View style={styles.realtorRow}>
                        <Text style={styles.rankText}>
                          {idx < 3 ? medals[idx] : `#${r.rank || idx + 1}`}
                        </Text>
                        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {(r.firstName?.[0] ?? '') + (r.lastName?.[0] ?? '')}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.realtorName}>
                            {r.firstName} {r.lastName}
                          </Text>
                          <Text style={styles.realtorMeta}>
                            {r.salesCount} sales • {formatCompactNumber(r.totalCommission)} commission
                          </Text>
                        </View>
                        <Text style={styles.realtorAmount}>
                          {formatCompactNumber(r.totalSalesValue)}
                        </Text>
                      </View>
                    </Card>
                  );
                })
              )}

              {/* Quick Links */}
              <Text style={styles.sectionTitle}>Deep Dive</Text>
              <View style={styles.linkGrid}>
                {[
                  { label: 'Charts', icon: 'analytics-outline', color: colors.primary, bg: colors.primaryLight, route: '/(admin)/analytics-charts' },
                  { label: 'Reports', icon: 'document-attach-outline', color: colors.teal, bg: colors.tealLight, route: '/(admin)/reports' },
                  { label: 'Top Realtors', icon: 'podium-outline', color: colors.warning, bg: colors.warningLight, route: '/(admin)/top-realtors' },
                  { label: 'Activity', icon: 'list-outline', color: colors.purple, bg: colors.purpleLight, route: '/(admin)/activity-logs' },
                ].map((link) => (
                  <TouchableOpacity
                    key={link.label}
                    style={styles.linkCard}
                    onPress={() => router.push(link.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.linkIcon, { backgroundColor: link.bg }]}>
                      <Ionicons name={link.icon as any} size={22} color={link.color} />
                    </View>
                    <Text style={styles.linkLabel}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        )}
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    content: { padding: Spacing.xl, paddingBottom: 40 },

    // Period selector
    periodRow: { gap: Spacing.sm, marginBottom: Spacing.xl, paddingRight: Spacing.md },

    // Hero Card
    heroCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
    heroValue: { ...Typography.h1, color: '#fff', marginTop: 4, marginBottom: Spacing.lg },
    heroRow: { flexDirection: 'row', alignItems: 'center' },
    heroStat: { flex: 1, alignItems: 'center' },
    heroStatValue: { ...Typography.h3, color: '#fff' },
    heroStatLabel: { ...Typography.small, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

    // Chart
    chartContainer: { marginBottom: Spacing.sm },
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 100,
      gap: 2,
    },
    chartBar: {
      borderRadius: 2,
      minWidth: 4,
    },
    chartLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    chartLabel: { ...Typography.small, color: colors.textMuted },

    // Section
    sectionTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    viewAll: { ...Typography.captionMedium },

    // KPI Grid
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    kpiCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderLeftWidth: 3,
      ...Shadows.sm,
    },
    kpiValue: { ...Typography.h3, color: colors.textPrimary, marginTop: Spacing.sm },
    kpiLabel: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    kpiSub: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // Commissions
    commRow: { flexDirection: 'row', gap: Spacing.md },
    commItem: { flex: 1, alignItems: 'center' },
    commDot: { width: 8, height: 8, borderRadius: 4, marginBottom: Spacing.sm },
    commCount: { ...Typography.h3, color: colors.textPrimary },
    commLabel: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    commAmount: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // Split row
    splitRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
    splitCard: { flex: 1 },
    splitTitle: { ...Typography.captionMedium, color: colors.textSecondary, marginTop: Spacing.sm },
    splitDetail: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: Spacing.sm },
    splitValue: { ...Typography.h3, color: colors.textPrimary },
    splitSub: { ...Typography.small, color: colors.textMuted },
    splitAmount: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // Realtors
    realtorCard: { marginBottom: Spacing.sm },
    realtorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    rankText: { ...Typography.h4, color: colors.textPrimary, width: 32, textAlign: 'center' },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.captionMedium },
    realtorName: { ...Typography.bodyMedium, color: colors.textPrimary },
    realtorMeta: { ...Typography.caption, color: colors.textSecondary },
    realtorAmount: { ...Typography.bodySemiBold, color: colors.success },

    // Quick Links
    linkGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    linkCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      ...Shadows.sm,
    },
    linkIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    linkLabel: { ...Typography.captionMedium, color: colors.textPrimary },

    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
      marginTop: Spacing.md,
    },
  });
