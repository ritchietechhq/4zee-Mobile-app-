import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterChip } from '@/components/ui/FilterChip';
import { formatCompactNumber } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type {
  AnalyticsPeriod,
  AnalyticsRevenueChart,
  AnalyticsUserGrowthChart,
  AnalyticsApplicationsChart,
  AnalyticsCommissionsChart,
  AnalyticsPropertyStats,
  AnalyticsKYCStats,
} from '@/types/admin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg * 2;

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '28d', label: '28D' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
  { key: 'all', label: 'All' },
];

type ChartTab = 'revenue' | 'users' | 'applications' | 'commissions' | 'properties' | 'kyc';

const TABS: { key: ChartTab; label: string; icon: string }[] = [
  { key: 'revenue', label: 'Revenue', icon: 'cash-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'applications', label: 'Apps', icon: 'document-text-outline' },
  { key: 'commissions', label: 'Commissions', icon: 'trophy-outline' },
  { key: 'properties', label: 'Properties', icon: 'home-outline' },
  { key: 'kyc', label: 'KYC', icon: 'shield-outline' },
];

export default function AnalyticsChartsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [period, setPeriod] = useState<AnalyticsPeriod>('28d');
  const [activeTab, setActiveTab] = useState<ChartTab>('revenue');
  const [revenueData, setRevenueData] = useState<AnalyticsRevenueChart | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<AnalyticsUserGrowthChart | null>(null);
  const [appData, setAppData] = useState<AnalyticsApplicationsChart | null>(null);
  const [commData, setCommData] = useState<AnalyticsCommissionsChart | null>(null);
  const [propertyData, setPropertyData] = useState<AnalyticsPropertyStats | null>(null);
  const [kycData, setKycData] = useState<AnalyticsKYCStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (p: AnalyticsPeriod) => {
    try {
      const [rev, ug, apps, comm, prop, kyc] = await Promise.all([
        adminService.getRevenueChart(p),
        adminService.getUserGrowthChart(p),
        adminService.getApplicationsChart(p),
        adminService.getCommissionsChart(p),
        adminService.getPropertyAnalytics(),
        adminService.getKYCAnalytics(),
      ]);
      setRevenueData(rev);
      setUserGrowthData(ug);
      setAppData(apps);
      setCommData(comm);
      setPropertyData(prop);
      setKycData(kyc);
    } catch (e) {
      console.error('Charts fetch error:', e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData(period).finally(() => setIsLoading(false));
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

  // ─── Bar Chart Renderer ────────────────────────────────────
  const renderBarChart = (
    data: Array<Record<string, any>>,
    valueKeys: { key: string; color: string }[],
    dateKey: string = 'date',
  ) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="analytics-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyText}>No data for this period</Text>
        </View>
      );
    }

    const maxVal = Math.max(
      ...data.map((d) => valueKeys.reduce((sum, vk) => sum + (Number(d[vk.key]) || 0), 0)),
      1,
    );

    const barGroupWidth = Math.max(8, CHART_WIDTH / data.length - 2);
    const barWidth = Math.max(3, barGroupWidth / valueKeys.length - 1);

    return (
      <View>
        {/* Legend */}
        <View style={styles.legend}>
          {valueKeys.map((vk) => (
            <View key={vk.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: vk.color }]} />
              <Text style={styles.legendText}>{vk.key}</Text>
            </View>
          ))}
        </View>

        {/* Bars */}
        <View style={styles.chartBars}>
          {data.slice(-20).map((d, i) => (
            <View key={i} style={styles.barGroup}>
              {valueKeys.map((vk) => {
                const val = Number(d[vk.key]) || 0;
                const height = Math.max(2, (val / maxVal) * 120);
                return (
                  <View
                    key={vk.key}
                    style={[
                      styles.chartBar,
                      { height, width: barWidth, backgroundColor: vk.color },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisRow}>
          <Text style={styles.xAxisLabel}>
            {data[0]?.[dateKey]
              ? new Date(data[0][dateKey]).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
              : ''}
          </Text>
          <Text style={styles.xAxisLabel}>
            {data[data.length - 1]?.[dateKey]
              ? new Date(data[data.length - 1][dateKey]).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
              : ''}
          </Text>
        </View>
      </View>
    );
  };

  // ─── Horizontal Bar Chart ─────────────────────────────────
  const renderHorizontalBars = (
    entries: Array<{ label: string; value: number; color: string }>,
  ) => {
    const maxVal = Math.max(...entries.map((e) => e.value), 1);
    return (
      <View>
        {entries.map((entry) => (
          <View key={entry.label} style={styles.hBarRow}>
            <Text style={styles.hBarLabel} numberOfLines={1}>{entry.label}</Text>
            <View style={styles.hBarTrack}>
              <View
                style={[
                  styles.hBarFill,
                  {
                    width: `${Math.max(2, (entry.value / maxVal) * 100)}%`,
                    backgroundColor: entry.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.hBarValue}>{entry.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ─── Chart Content ─────────────────────────────────────────
  const renderChartContent = () => {
    switch (activeTab) {
      case 'revenue':
        return (
          <Card variant="elevated" padding="lg">
            <Text style={styles.cardTitle}>Revenue Over Time</Text>
            <Text style={styles.cardSubtitle}>Sales count & revenue (kobo → ₦)</Text>
            {renderBarChart(
              revenueData?.data ?? [],
              [
                { key: 'revenue', color: colors.primary },
                { key: 'salesCount', color: colors.success },
              ],
            )}
            {revenueData && revenueData.data.length > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {formatCompactNumber(revenueData.data.reduce((s, d) => s + d.revenue, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {revenueData.data.reduce((s, d) => s + d.salesCount, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Sales</Text>
                </View>
              </View>
            )}
          </Card>
        );

      case 'users':
        return (
          <Card variant="elevated" padding="lg">
            <Text style={styles.cardTitle}>User Growth</Text>
            <Text style={styles.cardSubtitle}>New registrations by role</Text>
            {renderBarChart(
              userGrowthData?.data ?? [],
              [
                { key: 'clients', color: colors.primary },
                { key: 'realtors', color: colors.teal },
              ],
            )}
            {userGrowthData && userGrowthData.data.length > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {userGrowthData.data.reduce((s, d) => s + d.total, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total New</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {userGrowthData.data.reduce((s, d) => s + d.clients, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Clients</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {userGrowthData.data.reduce((s, d) => s + d.realtors, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Realtors</Text>
                </View>
              </View>
            )}
          </Card>
        );

      case 'applications':
        return (
          <Card variant="elevated" padding="lg">
            <Text style={styles.cardTitle}>Applications</Text>
            <Text style={styles.cardSubtitle}>By status over time</Text>
            {renderBarChart(
              appData?.data ?? [],
              [
                { key: 'approved', color: colors.success },
                { key: 'pending', color: colors.warning },
                { key: 'rejected', color: colors.error },
              ],
            )}
          </Card>
        );

      case 'commissions':
        return (
          <Card variant="elevated" padding="lg">
            <Text style={styles.cardTitle}>Commissions</Text>
            <Text style={styles.cardSubtitle}>Direct vs referral amounts</Text>
            {renderBarChart(
              commData?.data ?? [],
              [
                { key: 'direct', color: colors.primary },
                { key: 'referral', color: colors.purple },
              ],
            )}
            {commData && commData.data.length > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {formatCompactNumber(commData.data.reduce((s, d) => s + d.total, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {formatCompactNumber(commData.data.reduce((s, d) => s + d.direct, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Direct</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {formatCompactNumber(commData.data.reduce((s, d) => s + d.referral, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Referral</Text>
                </View>
              </View>
            )}
          </Card>
        );

      case 'properties':
        if (!propertyData) return null;
        return (
          <View style={{ gap: Spacing.lg }}>
            {/* By Type */}
            <Card variant="elevated" padding="lg">
              <Text style={styles.cardTitle}>Properties by Type</Text>
              {renderHorizontalBars(
                Object.entries(propertyData.byType).map(([label, value]) => ({
                  label,
                  value: value as number,
                  color: colors.primary,
                })),
              )}
            </Card>

            {/* By Availability */}
            <Card variant="elevated" padding="lg">
              <Text style={styles.cardTitle}>Availability</Text>
              {renderHorizontalBars(
                Object.entries(propertyData.byAvailability).map(([label, value]) => ({
                  label,
                  value: value as number,
                  color: label === 'AVAILABLE' ? colors.success : label === 'SOLD' ? colors.error : colors.warning,
                })),
              )}
            </Card>

            {/* Top Viewed */}
            {propertyData.topViewed?.length > 0 && (
              <Card variant="elevated" padding="lg">
                <Text style={styles.cardTitle}>Top Viewed</Text>
                {propertyData.topViewed.slice(0, 5).map((p, idx) => (
                  <View key={p.id} style={styles.topPropertyRow}>
                    <Text style={styles.topPropertyRank}>{idx + 1}</Text>
                    <Text style={styles.topPropertyTitle} numberOfLines={1}>{p.title}</Text>
                    <View style={styles.topPropertyBadge}>
                      <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.topPropertyViews}>{p.views}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Top by Location */}
            {propertyData.byLocation?.length > 0 && (
              <Card variant="elevated" padding="lg">
                <Text style={styles.cardTitle}>By Location</Text>
                {renderHorizontalBars(
                  propertyData.byLocation.slice(0, 8).map((loc) => ({
                    label: loc.location,
                    value: loc.count,
                    color: colors.teal,
                  })),
                )}
              </Card>
            )}
          </View>
        );

      case 'kyc':
        if (!kycData) return null;
        const kycColors: Record<string, string> = {
          PENDING: colors.warning,
          APPROVED: colors.success,
          REJECTED: colors.error,
          NOT_SUBMITTED: colors.slate,
        };
        return (
          <View style={{ gap: Spacing.lg }}>
            <Card variant="elevated" padding="lg">
              <Text style={styles.cardTitle}>Client KYC Status</Text>
              {renderHorizontalBars(
                Object.entries(kycData.clients).map(([label, value]) => ({
                  label,
                  value: value as number,
                  color: kycColors[label] ?? colors.primary,
                })),
              )}
            </Card>
            <Card variant="elevated" padding="lg">
              <Text style={styles.cardTitle}>Realtor KYC Status</Text>
              {renderHorizontalBars(
                Object.entries(kycData.realtors).map(([label, value]) => ({
                  label,
                  value: value as number,
                  color: kycColors[label] ?? colors.primary,
                })),
              )}
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Charts & Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={40} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={300} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={200} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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

            {/* Tab Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.key ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chart Content */}
            {renderChartContent()}

            <View style={{ height: 40 }} />
          </ScrollView>
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

    // Period & Tabs
    periodRow: { gap: Spacing.sm, marginBottom: Spacing.lg },
    tabRow: { gap: Spacing.sm, marginBottom: Spacing.xl },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: { ...Typography.captionMedium, color: colors.textSecondary },
    tabTextActive: { color: colors.white },

    // Card
    cardTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: 4 },
    cardSubtitle: { ...Typography.caption, color: colors.textMuted, marginBottom: Spacing.lg },

    // Bar chart
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 120,
      gap: 2,
    },
    barGroup: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 1,
    },
    chartBar: {
      borderRadius: 2,
      minWidth: 3,
    },
    xAxisRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    xAxisLabel: { ...Typography.small, color: colors.textMuted },

    // Legend
    legend: {
      flexDirection: 'row',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { ...Typography.small, color: colors.textSecondary, textTransform: 'capitalize' },

    // Summary
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { ...Typography.bodySemiBold, color: colors.textPrimary },
    summaryLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // Horizontal bars
    hBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    hBarLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      width: 80,
      textTransform: 'capitalize',
    },
    hBarTrack: {
      flex: 1,
      height: 16,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.sm,
      overflow: 'hidden',
    },
    hBarFill: {
      height: '100%',
      borderRadius: BorderRadius.sm,
    },
    hBarValue: {
      ...Typography.captionMedium,
      color: colors.textPrimary,
      width: 40,
      textAlign: 'right',
    },

    // Top properties
    topPropertyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    topPropertyRank: { ...Typography.captionMedium, color: colors.textMuted, width: 20 },
    topPropertyTitle: { ...Typography.body, color: colors.textPrimary, flex: 1 },
    topPropertyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    topPropertyViews: { ...Typography.captionMedium, color: colors.textMuted },

    // Empty
    emptyChart: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 120,
      gap: Spacing.sm,
    },
    emptyText: { ...Typography.body, color: colors.textMuted },
  });
