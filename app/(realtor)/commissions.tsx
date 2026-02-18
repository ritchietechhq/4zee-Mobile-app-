import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { commissionService } from '@/services/commission.service';
import type {
  Commission,
  CommissionSummary,
  CommissionStatus,
  CommissionType,
} from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';

const statusColors: Record<CommissionStatus, { bg: string; text: string }> = {
  PENDING: { bg: Colors.warningLight, text: Colors.warning },
  APPROVED: { bg: Colors.primaryLight, text: Colors.primary },
  PAID: { bg: Colors.successLight, text: Colors.success },
  CANCELLED: { bg: Colors.errorLight, text: Colors.error },
};

const typeLabels: Record<CommissionType, string> = {
  DIRECT: 'Direct Sale',
  REFERRAL: 'Referral',
};

export default function CommissionsScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'ALL'>('ALL');

  const fetchCommissions = useCallback(
    async (cursor?: string) => {
      try {
        const filterStatus = statusFilter !== 'ALL' ? statusFilter : undefined;
        const response = await commissionService.getMyCommissions(
          filterStatus,
          cursor,
          15,
        );
        const items = response.items || [];
        const pagination = response.pagination;

        if (cursor) {
          setCommissions((prev) => [...prev, ...items]);
        } else {
          setCommissions(items);
        }

        setNextCursor(pagination?.nextCursor);
        setHasNext(pagination?.hasNext || false);
      } catch (error) {
        console.error('Failed to fetch commissions:', error);
      }
    },
    [statusFilter],
  );

  const fetchSummary = useCallback(async () => {
    try {
      const data = await commissionService.getMySummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch commission summary:', error);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCommissions(), fetchSummary()]);
    setIsLoading(false);
  }, [fetchCommissions, fetchSummary]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCommissions(), fetchSummary()]);
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasNext || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchCommissions(nextCursor);
    setIsLoadingMore(false);
  };

  const renderSummaryCard = () => {
    if (!summary) return null;
    return (
      <Card variant="elevated" padding="xl" style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Commission Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.total.amount)}
            </Text>
            <Text style={styles.summaryLabel}>Total Earned</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.pending.amount)}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.paid.amount)}
            </Text>
            <Text style={styles.summaryLabel}>Paid Out</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.total.count}</Text>
            <Text style={styles.summaryLabel}>Total Count</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderFilters = () => {
    const filters: Array<CommissionStatus | 'ALL'> = [
      'ALL',
      'PENDING',
      'APPROVED',
      'PAID',
      'CANCELLED',
    ];
    return (
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              statusFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f && styles.filterChipTextActive,
              ]}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCommission = ({ item }: { item: Commission }) => {
    const color = statusColors[item.status] || statusColors.PENDING;
    return (
      <Card variant="outlined" padding="lg" style={styles.commissionCard}>
        <View style={styles.commissionHeader}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={item.type === 'DIRECT' ? 'storefront-outline' : 'people-outline'}
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.typeLabel}>{typeLabels[item.type]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
            <Text style={[styles.statusText, { color: color.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.commissionAmount}>
          {formatCurrency(item.amount)}
        </Text>

        {item.sale?.property && (
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.sale.property.title}
          </Text>
        )}

        {item.sale?.client?.user && (
          <Text style={styles.clientName} numberOfLines={1}>
            Client: {item.sale.client.user.firstName} {item.sale.client.user.lastName}
          </Text>
        )}

        <View style={styles.commissionMeta}>
          <Text style={styles.metaText}>
            Rate: {(item.rate * 100).toFixed(1)}%
          </Text>
          <Text style={styles.metaText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cash-outline" size={64} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Commissions</Text>
        <Text style={styles.emptySubtitle}>
          {statusFilter === 'ALL'
            ? 'Your commissions will appear here when you make sales or referrals.'
            : `No ${statusFilter.toLowerCase()} commissions found.`}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {renderSummaryCard()}
      {renderFilters()}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Commissions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commissions</Text>
      </View>

      <FlatList
        data={commissions}
        keyExtractor={(item) => item.id}
        renderItem={renderCommission}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  summaryItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  summaryValue: {
    ...Typography.h4,
    color: Colors.primary,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  commissionCard: {
    marginBottom: Spacing.md,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeLabel: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
  },
  commissionAmount: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  propertyTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  clientName: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  commissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaText: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
