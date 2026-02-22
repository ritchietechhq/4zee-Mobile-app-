import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { commissionService } from '@/services/commission.service';
import { messagingService } from '@/services/messaging.service';
import type { Commission, CommissionStatus, CommissionSummary } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

export default function LeadsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const statusColors: Record<CommissionStatus, { bg: string; text: string; icon: string }> = {
    PENDING: { bg: colors.warningLight, text: colors.warning, icon: 'time-outline' },
    APPROVED: { bg: colors.primaryLight, text: colors.primary, icon: 'checkmark-circle-outline' },
    PAID: { bg: colors.successLight, text: colors.success, icon: 'wallet-outline' },
    CANCELLED: { bg: colors.errorLight, text: colors.error, icon: 'close-circle-outline' },
  };

  const [leads, setLeads] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<CommissionStatus | 'ALL'>('ALL');

  const fetchLeads = useCallback(async (cursor?: string) => {
    try {
      const status = filter !== 'ALL' ? filter : undefined;
      const res = await commissionService.getMyCommissions(status, cursor, 15);
      const items = res.items || [];
      if (cursor) {
        setLeads((prev) => [...prev, ...items]);
      } else {
        setLeads(items);
      }
      setNextCursor(res.pagination?.nextCursor);
      setHasNext(res.pagination?.hasNext || false);
    } catch (error) {
      if (__DEV__) console.warn('[Leads] fetch error', error);
    }
  }, [filter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await commissionService.getMySummary();
      setSummary(res);
    } catch {
      // summary is non-critical
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.allSettled([fetchLeads(), fetchSummary()]);
      setIsLoading(false);
    })();
  }, [fetchLeads, fetchSummary]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchLeads(), fetchSummary()]);
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasNext || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchLeads(nextCursor);
    setIsLoadingMore(false);
  };

  // ── Summary Card ──────────────────────────────────────────
  const SummaryCard = () => {
    if (!summary) return null;
    return (
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: colors.warning }]}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.pending.count}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(summary.pending.amount)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.approved.count}</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(summary.approved.amount)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: colors.success }]}>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.paid.count}</Text>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(summary.paid.amount)}</Text>
        </View>
      </View>
    );
  };

  // ── Filter Chips ──────────────────────────────────────────
  const renderFilters = () => {
    const filters: Array<{ key: CommissionStatus | 'ALL'; label: string; count?: number }> = [
      { key: 'ALL', label: 'All', count: summary?.total.count },
      { key: 'PENDING', label: 'Pending', count: summary?.pending.count },
      { key: 'APPROVED', label: 'Approved', count: summary?.approved.count },
      { key: 'PAID', label: 'Paid', count: summary?.paid.count },
      { key: 'CANCELLED', label: 'Cancelled' },
    ];
    return (
      <View>
        <SummaryCard />
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}{f.count != null ? ` (${f.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ── Lead Card ─────────────────────────────────────────────
  const renderLead = ({ item }: { item: Commission }) => {
    const sc = statusColors[item.status] || statusColors.PENDING;
    const clientUser = item.sale?.client?.user;
    const clientName = clientUser
      ? `${clientUser.firstName} ${clientUser.lastName}`
      : 'Unknown Client';
    const clientInitial = clientUser?.firstName?.charAt(0) || '?';
    const propertyTitle = item.sale?.property?.title || 'Property';

    return (
      <Card variant="outlined" padding="lg" style={styles.leadCard}>
        <View style={styles.leadHeader}>
          <View style={[styles.clientAvatar, { backgroundColor: sc.bg }]}>
            <Text style={[styles.clientAvatarText, { color: sc.text }]}>{clientInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
            <Text style={styles.propertyName} numberOfLines={1}>{propertyTitle}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon as any} size={12} color={sc.text} />
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.leadMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaValue}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaValue}>{(item.rate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name={item.type === 'DIRECT' ? 'storefront-outline' : 'people-outline'} size={14} color={colors.textMuted} />
            <Text style={styles.metaValue}>{item.type === 'DIRECT' ? 'Direct' : 'Referral'}</Text>
          </View>
        </View>

        <View style={styles.leadFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="31%" height={90} style={{ borderRadius: BorderRadius.lg }} />
        ))}
      </View>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height={150} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Leads</Text>
          <Text style={styles.headerSub}>
            {summary ? `${summary.total.count} total · ${formatCurrency(summary.total.amount)} earned` : `${leads.length} total`}
          </Text>
        </View>
      </View>

      {isLoading ? renderSkeleton() : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderLead}
          ListHeaderComponent={renderFilters}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No Leads Yet"
              description="Your leads from sales and referrals will appear here. Share listings to start earning commissions."
            />
          }
          ListFooterComponent={isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: colors.textPrimary },
  headerSub: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryCard: {
    flex: 1, backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 3,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  summaryValue: { ...Typography.h3, fontWeight: '700' },
  summaryLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
  summaryAmount: { ...Typography.small, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },

  // Filters
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...Typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },

  // Lead Card
  leadCard: { marginBottom: Spacing.md, backgroundColor: colors.cardBackground },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  clientAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  clientAvatarText: { ...Typography.bodySemiBold, fontWeight: '700' },
  clientName: { ...Typography.bodySemiBold, color: colors.textPrimary },
  propertyName: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  statusText: { ...Typography.small, fontWeight: '600' },

  leadMeta: {
    flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap',
    paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaValue: { ...Typography.captionMedium, color: colors.textSecondary },

  leadFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { ...Typography.small, color: colors.textTertiary },

  skeletonWrap: { paddingHorizontal: Spacing.xl },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
