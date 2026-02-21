import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterChip } from '@/components/ui/FilterChip';
import { Input } from '@/components/ui/Input';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { ReportOverview, ReportType } from '@/types/admin';

interface ReportConfig {
  key: ReportType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
}

export default function ReportsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const REPORT_TYPES: ReportConfig[] = useMemo(() => [
    { key: 'sales', icon: 'cart-outline', label: 'Sales Report', desc: 'Revenue and sales breakdown', color: colors.primary },
    { key: 'applications', icon: 'document-text-outline', label: 'Applications Report', desc: 'Application status and trends', color: colors.warning },
    { key: 'commissions', icon: 'trophy-outline', label: 'Commissions Report', desc: 'Commission payouts and rates', color: colors.purple },
    { key: 'payment-plans', icon: 'calendar-outline', label: 'Payment Plans Report', desc: 'Enrollment and payment tracking', color: colors.teal },
    { key: 'properties', icon: 'home-outline', label: 'Properties Report', desc: 'Inventory and listing performance', color: colors.success },
    { key: 'realtors', icon: 'people-outline', label: 'Realtors Report', desc: 'Realtor performance and activity', color: colors.indigo },
    { key: 'clients', icon: 'person-outline', label: 'Clients Report', desc: 'Client accounts and KYC status', color: colors.sky },
    { key: 'payments', icon: 'card-outline', label: 'Payments Report', desc: 'Payment transactions and status', color: colors.orange },
    { key: 'payouts', icon: 'cash-outline', label: 'Payouts Report', desc: 'Payout requests and processing', color: colors.error },
  ], [colors]);

  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'custom'>('all');

  const fetchData = useCallback(async () => {
    try {
      const params = filterMode === 'custom' && startDate && endDate
        ? { startDate, endDate }
        : undefined;
      const data = await adminService.getOverviewReport(params);
      setOverview(data);
    } catch (e) {
      console.error('Reports fetch error:', e);
    }
  }, [filterMode, startDate, endDate]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const getDateParams = () => {
    if (filterMode === 'custom' && startDate && endDate) {
      return { startDate, endDate };
    }
    return undefined;
  };

  const handleViewReport = useCallback(async (type: ReportType) => {
    setActionLoading(`view-${type}`);
    try {
      const params = getDateParams();
      let data;
      switch (type) {
        case 'sales': data = await adminService.getSalesReport(params); break;
        case 'applications': data = await adminService.getApplicationsReport(params); break;
        case 'commissions': data = await adminService.getCommissionsReport(params); break;
        case 'payment-plans': data = await adminService.getPaymentPlansReport(params); break;
        case 'properties': data = await adminService.getPropertiesReport(params); break;
        case 'realtors': data = await adminService.getRealtorsReport(params); break;
        default: data = await adminService.getSalesReport(params); break;
      }
      Alert.alert('Report Ready', `${type} report generated successfully. Summary data loaded.`);
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Failed to generate report');
    } finally {
      setActionLoading(null);
    }
  }, [filterMode, startDate, endDate]);

  const handleExportCSV = useCallback(async (type: ReportType) => {
    setActionLoading(`csv-${type}`);
    try {
      const params = getDateParams();
      await adminService.exportReportCSV(type, params);
      Alert.alert('CSV Export', `${type} CSV export initiated. Download will begin shortly.`);
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'CSV export failed');
    } finally {
      setActionLoading(null);
    }
  }, [filterMode, startDate, endDate]);

  const handleEmailReport = useCallback(async (type: ReportType) => {
    Alert.alert(
      'Email Report',
      `Send ${type} report to your email address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setActionLoading(`email-${type}`);
            try {
              const params = getDateParams();
              const result = await adminService.emailReport(type, params);
              Alert.alert(
                '✅ Report Sent',
                `${result.message}\n\nRows: ${result.rows}\nDate Range: ${result.dateRange}`,
              );
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Failed to email report');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }, [filterMode, startDate, endDate]);

  const showActions = (report: ReportConfig) => {
    const actions: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [
      { text: 'Cancel', style: 'cancel' },
    ];

    // Only some report types support the view action (the original 6)
    const viewableTypes: ReportType[] = ['sales', 'applications', 'commissions', 'payment-plans', 'properties', 'realtors'];
    if (viewableTypes.includes(report.key)) {
      actions.push({ text: '📊 View Report', onPress: () => handleViewReport(report.key) });
    }

    actions.push(
      { text: '📥 Download CSV', onPress: () => handleExportCSV(report.key) },
      { text: '📧 Email Report', onPress: () => handleEmailReport(report.key) },
    );

    Alert.alert(report.label, 'Choose an action', actions);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Exports</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={100} style={{ marginBottom: 16 }} />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="100%" height={90} style={{ marginBottom: 12 }} />
            ))}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            {/* Executive Overview */}
            {overview && (
              <Card variant="elevated" padding="lg" style={styles.overviewCard}>
                <Text style={styles.cardLabel}>EXECUTIVE OVERVIEW</Text>
                <View style={styles.overviewGrid}>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewValue}>{overview.salesCount ?? 0}</Text>
                    <Text style={styles.overviewLabel}>Sales</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewValue}>
                      {typeof overview.userCounts === 'object'
                        ? Object.values(overview.userCounts).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
                        : 0}
                    </Text>
                    <Text style={styles.overviewLabel}>Users</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewValue}>
                      {(overview.alerts ?? []).length}
                    </Text>
                    <Text style={styles.overviewLabel}>Alerts</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Date Filter */}
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.filterRow}>
              <FilterChip
                label="All Time"
                selected={filterMode === 'all'}
                onPress={() => setFilterMode('all')}
              />
              <FilterChip
                label="Custom Range"
                selected={filterMode === 'custom'}
                onPress={() => setFilterMode('custom')}
              />
            </View>
            {filterMode === 'custom' && (
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Start Date"
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="End Date"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            )}

            {/* Report Types */}
            <Text style={styles.sectionTitle}>Generate Reports</Text>
            <Text style={styles.sectionSubtitle}>
              Tap a report to view, download CSV, or email it
            </Text>
            {REPORT_TYPES.map((r) => {
              const isActive =
                actionLoading === `view-${r.key}` ||
                actionLoading === `csv-${r.key}` ||
                actionLoading === `email-${r.key}`;
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.7}
                  onPress={() => showActions(r)}
                  disabled={!!actionLoading}
                  style={[styles.reportCard, isActive && styles.reportCardActive]}
                >
                  <View style={[styles.reportIcon, { backgroundColor: `${r.color}18` }]}>
                    <Ionicons name={r.icon} size={22} color={r.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportLabel}>{r.label}</Text>
                    <Text style={styles.reportDesc}>{r.desc}</Text>
                  </View>
                  {isActive ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.reportActions}>
                      <TouchableOpacity
                        onPress={() => handleExportCSV(r.key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="download-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleEmailReport(r.key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="mail-outline" size={18} color={colors.teal} />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Info Card */}
            <Card variant="outlined" padding="lg" style={styles.infoCard}>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>About Reports</Text>
                  <Text style={styles.infoText}>
                    • View reports to see summary data in-app{'\n'}
                    • Download CSV for spreadsheet analysis{'\n'}
                    • Email report sends a formatted CSV to your admin email{'\n'}
                    • Custom date range filters apply to all reports
                  </Text>
                </View>
              </View>
            </Card>

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

    // Overview
    overviewCard: { marginBottom: Spacing.xl },
    cardLabel: {
      ...Typography.captionMedium,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    overviewGrid: { flexDirection: 'row', gap: Spacing.md },
    overviewItem: { flex: 1, alignItems: 'center' },
    overviewValue: { ...Typography.h3, color: colors.textPrimary },
    overviewLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // Section
    sectionTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    sectionSubtitle: {
      ...Typography.caption,
      color: colors.textMuted,
      marginBottom: Spacing.lg,
    },

    // Filter
    filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    dateRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },

    // Report cards
    reportCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.sm,
    },
    reportCardActive: {
      opacity: 0.7,
    },
    reportIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reportLabel: { ...Typography.bodyMedium, color: colors.textPrimary },
    reportDesc: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    reportActions: { flexDirection: 'row', gap: Spacing.md },
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Info card
    infoCard: { marginTop: Spacing.xl },
    infoTitle: { ...Typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
    infoText: { ...Typography.caption, color: colors.textSecondary, lineHeight: 20 },
  });
