import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminPayment, AdminPaymentStats } from '@/types/admin';

const STATUS_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  SUCCESS: 'success',
  COMPLETED: 'success',
  PENDING: 'warning',
  PROCESSING: 'info',
  FAILED: 'error',
  REFUNDED: 'default',
};

export default function PaymentsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [stats, setStats] = useState<AdminPaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminService.getPayments(params as any);
      const newData = res.data ?? [];
      setPayments(append ? (prev) => [...prev, ...newData] : newData);
      setHasMore(newData.length >= 20);
    } catch (e) {
      console.error('Fetch payments error:', e);
    }
  }, [statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminService.getPaymentStats();
      setStats(data);
    } catch (e) {
      console.error('Fetch payment stats error:', e);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPayments(1), fetchStats()]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    setIsLoading(true);
    fetchPayments(1).finally(() => setIsLoading(false));
  }, [statusFilter]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([fetchPayments(1), fetchStats()]);
    setIsRefreshing(false);
  }, [fetchPayments, fetchStats]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchPayments(next, true);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, page, fetchPayments]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderPayment = ({ item }: { item: AdminPayment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentRow}>
        <View style={styles.paymentIcon}>
          <Ionicons
            name={item.status === 'SUCCESS' || item.status === 'COMPLETED' ? 'checkmark-circle' : item.status === 'FAILED' ? 'close-circle' : 'time'}
            size={22}
            color={STATUS_BADGE[item.status] === 'success' ? colors.success : STATUS_BADGE[item.status] === 'error' ? colors.error : colors.warning}
          />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.paymentRef} numberOfLines={1}>Ref: {item.reference}</Text>
          {item.client && (
            <Text style={styles.paymentClient} numberOfLines={1}>
              {item.client.firstName} {item.client.lastName}
            </Text>
          )}
        </View>
        <View style={styles.paymentRight}>
          <Badge label={item.status} variant={STATUS_BADGE[item.status] ?? 'default'} size="sm" />
          <Text style={styles.paymentDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      {item.property && (
        <View style={styles.paymentProperty}>
          <Ionicons name="home-outline" size={14} color={colors.textMuted} />
          <Text style={styles.paymentPropertyText} numberOfLines={1}>{item.property.title}</Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSubtitle}>All payment transactions</Text>
          </View>
        </View>

        {/* Stats */}
        {!isLoading && stats && (
          <View style={styles.statsRow}>
            {[
              { label: 'Total', value: formatCurrency(stats.totalAmount), color: colors.primary },
              { label: 'Count', value: String(stats.totalPayments), color: colors.teal },
              { label: 'Recent', value: String(stats.recentCount), color: colors.warning },
            ].map((s) => (
              <Card key={s.label} variant="elevated" padding="md" style={styles.statCard}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* Filters */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              selected={statusFilter === f.value}
              onPress={() => setStatusFilter(f.value)}
            />
          ))}
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={90} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
            ))}
          </View>
        ) : payments.length === 0 ? (
          <EmptyState icon="card-outline" title="No payments found" description="Try adjusting your filters" />
        ) : (
          <FlatList
            data={payments}
            renderItem={renderPayment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isLoadingMore ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: Spacing.lg }} /> : null
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.cardBackground,
      alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    statsRow: {
      flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.md,
    },
    statCard: { flex: 1, alignItems: 'center' },
    statValue: { ...Typography.h4, fontWeight: '800' },
    statLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    filterRow: {
      flexDirection: 'row', paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md, gap: Spacing.sm, flexWrap: 'wrap',
    },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 30 },
    paymentCard: {
      backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
      padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
    },
    paymentRow: { flexDirection: 'row', alignItems: 'center' },
    paymentIcon: { marginRight: Spacing.md },
    paymentInfo: { flex: 1 },
    paymentAmount: { ...Typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
    paymentRef: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    paymentClient: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    paymentRight: { alignItems: 'flex-end', gap: Spacing.xs },
    paymentDate: { ...Typography.small, color: colors.textMuted },
    paymentProperty: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      marginTop: Spacing.sm, paddingTop: Spacing.sm,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    paymentPropertyText: { ...Typography.caption, color: colors.textMuted, flex: 1 },
  });
