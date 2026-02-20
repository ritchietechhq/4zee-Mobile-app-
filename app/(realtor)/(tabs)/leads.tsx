import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { commissionService } from '@/services/commission.service';
import type { Commission, CommissionStatus } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

export default function LeadsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const statusColors: Record<CommissionStatus, { bg: string; text: string }> = {
    PENDING: { bg: colors.warningLight, text: colors.warning },
    APPROVED: { bg: colors.primaryLight, text: colors.primary },
    PAID: { bg: colors.successLight, text: colors.success },
    CANCELLED: { bg: colors.errorLight, text: colors.error },
  };
  const [leads, setLeads] = useState<Commission[]>([]);
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
      console.error('Failed to fetch leads:', error);
    }
  }, [filter]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchLeads();
      setIsLoading(false);
    })();
  }, [fetchLeads]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads();
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasNext || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchLeads(nextCursor);
    setIsLoadingMore(false);
  };

  const renderFilters = () => {
    const filters: Array<CommissionStatus | 'ALL'> = ['ALL', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'];
    return (
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLead = ({ item }: { item: Commission }) => {
    const sc = statusColors[item.status] || statusColors.PENDING;
    const clientName = item.sale?.client?.user
      ? `${item.sale.client.user.firstName} ${item.sale.client.user.lastName}`
      : 'Unknown Client';
    const propertyTitle = item.sale?.property?.title || 'Property';

    return (
      <Card variant="outlined" padding="lg" style={styles.leadCard}>
        <View style={styles.leadHeader}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>
              {item.sale?.client?.user?.firstName?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
            <Text style={styles.propertyName} numberOfLines={1}>{propertyTitle}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.leadMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name={item.type === 'DIRECT' ? 'storefront-outline' : 'people-outline'} size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.type === 'DIRECT' ? 'Direct Sale' : 'Referral'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.leadDivider} />

        <View style={styles.leadActions}>
          <Text style={styles.rateText}>Commission: {(item.rate * 100).toFixed(1)}%</Text>
        </View>
      </Card>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height={140} style={{ marginBottom: Spacing.md }} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <Text style={styles.headerSub}>{leads.length} total</Text>
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
              description="Your leads from sales and referrals will appear here."
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
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...Typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  leadCard: { marginBottom: Spacing.md },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  clientAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { ...Typography.bodySemiBold, color: colors.primary },
  clientName: { ...Typography.bodySemiBold, color: colors.textPrimary },
  propertyName: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  statusText: { ...Typography.small, fontWeight: '600' },
  leadMeta: { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, color: colors.textMuted },
  leadDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: Spacing.md },
  leadActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateText: { ...Typography.captionMedium, color: colors.primary },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
