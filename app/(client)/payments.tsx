// ============================================================
// Payments History Screen — Client
// View all payments, status, and receipts
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { paymentService } from '@/services/payment.service';
import { formatCurrency } from '@/utils/formatCurrency';
import type { PaymentDetail } from '@/types';

type FilterTab = 'all' | 'success' | 'pending' | 'failed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Successful' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadPayments();
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const loadPayments = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setCursor(undefined);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await paymentService.getMyPayments(undefined, 20);
      setPayments(result?.items ?? []);
      setCursor(result?.pagination?.nextCursor);
      setHasMore(result?.pagination?.hasNext ?? false);
    } catch (error) {
      // API may return an error envelope — treat as empty list
      setPayments([]);
      setCursor(undefined);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || !cursor) return;

    setIsLoadingMore(true);
    try {
      const result = await paymentService.getMyPayments(cursor, 20);
      setPayments((prev) => [...prev, ...(result?.items ?? [])]);
      setCursor(result?.pagination?.nextCursor);
      setHasMore(result?.pagination?.hasNext ?? false);
    } catch (error) {
      // Stop pagination on error
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter payments based on active tab
  const filteredPayments = payments.filter((payment) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'success') return payment.status === 'SUCCESS';
    if (activeFilter === 'pending') return payment.status === 'INITIATED';
    if (activeFilter === 'failed') return payment.status === 'FAILED';
    return true;
  });

  // Calculate stats
  const totalPaid = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = payments.filter((p) => p.status === 'INITIATED').length;

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'INITIATED': return 'warning';
      case 'FAILED': return 'error';
      default: return 'warning';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'SUCCESS': return 'Paid';
      case 'INITIATED': return 'Pending';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderPaymentItem = useCallback(({ item, index }: { item: PaymentDetail; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to payment detail or property
          if (item.application?.id) {
            router.push(`/(client)/properties/${item.application.id}`);
          }
        }}
      >
        <Card style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <View style={[
              styles.paymentIcon,
              item.status === 'SUCCESS' && styles.paymentIconSuccess,
              item.status === 'FAILED' && styles.paymentIconFailed,
            ]}>
              <Ionicons
                name={
                  item.status === 'SUCCESS' ? 'checkmark-circle' :
                  item.status === 'FAILED' ? 'close-circle' : 'time'
                }
                size={24}
                color={
                  item.status === 'SUCCESS' ? Colors.success :
                  item.status === 'FAILED' ? Colors.error : Colors.warning
                }
              />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle} numberOfLines={1}>
                {item.application?.property?.title || 'Property Payment'}
              </Text>
              <Text style={styles.paymentDate}>
                {formatDate(item.paidAt || new Date().toISOString())}
              </Text>
            </View>
            <View style={styles.paymentAmountWrap}>
              <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
              <Badge
                label={getStatusLabel(item.status)}
                variant={getStatusVariant(item.status)}
                size="sm"
              />
            </View>
          </View>

          {/* Reference */}
          <View style={styles.paymentFooter}>
            <Text style={styles.referenceLabel}>Reference:</Text>
            <Text style={styles.referenceValue}>{item.reference}</Text>
          </View>

          {/* Channel info */}
          {item.channel && (
            <View style={styles.channelRow}>
              <Ionicons name="card-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.channelText}>
                Paid via {item.channel.charAt(0).toUpperCase() + item.channel.slice(1)}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  ), [fadeAnim]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Payments Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your payment history will appear here once you make a payment for a property.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loaderWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Ionicons name="wallet" size={20} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalPaid)}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="time" size={20} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="receipt" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{payments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </Card>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === tab.key && styles.filterTabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPayments(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
  loaderWrap: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loaderText: { ...Typography.caption, color: Colors.textMuted },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textMuted,
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: Colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  // Payment Card
  paymentCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconSuccess: {
    backgroundColor: Colors.successLight,
  },
  paymentIconFailed: {
    backgroundColor: Colors.errorLight,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  paymentDate: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  paymentAmountWrap: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  paymentAmount: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  paymentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  referenceLabel: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  referenceValue: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  channelText: {
    ...Typography.small,
    color: Colors.textMuted,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Loading More
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
