import React, { useEffect, useState, useCallback } from 'react';
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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const statusColors: Record<CommissionStatus, { bg: string; text: string }> = {
  PENDING: { bg: Colors.warningLight, text: Colors.warning },
  APPROVED: { bg: Colors.primaryLight, text: Colors.primary },
  PAID: { bg: Colors.successLight, text: Colors.success },
  CANCELLED: { bg: Colors.errorLight, text: Colors.error },
};

export default function LeadsScreen() {
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
    const colors = statusColors[item.status] || statusColors.PENDING;
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
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.leadMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name={item.type === 'DIRECT' ? 'storefront-outline' : 'people-outline'} size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.type === 'DIRECT' ? 'Direct Sale' : 'Referral'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
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
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  headerSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.captionMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  leadCard: { marginBottom: Spacing.md },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  clientAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { ...Typography.bodySemiBold, color: Colors.primary },
  clientName: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  propertyName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  statusText: { ...Typography.small, fontWeight: '600' },
  leadMeta: { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  leadDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.md },
  leadActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateText: { ...Typography.captionMedium, color: Colors.primary },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
