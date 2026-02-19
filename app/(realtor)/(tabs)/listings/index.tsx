import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import realtorService from '@/services/realtor.service';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Property, PropertyAvailability, ListingStats } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

type FilterKey = 'ALL' | PropertyAvailability;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'RESERVED', label: 'Reserved' },
  { key: 'SOLD', label: 'Sold' },
];

const availabilityVariant = (a: PropertyAvailability) => {
  switch (a) {
    case 'AVAILABLE': return 'success';
    case 'SOLD': return 'error';
    case 'RESERVED': return 'warning';
    default: return 'default';
  }
};

export default function RealtorListings() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await realtorService.getListingStats();
      setStats(data);
    } catch {}
  }, []);

  const fetchListings = useCallback(async (cursor?: string, availability?: FilterKey) => {
    try {
      const params: Record<string, any> = { limit: 15, cursor };
      if (availability && availability !== 'ALL') params.availability = availability;
      const result = await realtorService.getMyListings(params);
      const items = result.items || [];
      if (cursor) {
        setProperties((prev) => [...prev, ...items]);
      } else {
        setProperties(items);
      }
      setNextCursor(result.pagination?.nextCursor);
      setHasMore(result.pagination?.hasNext || false);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([fetchListings(undefined, filter), fetchStats()]);
      setIsLoading(false);
    })();
  }, [fetchListings, fetchStats, filter]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchListings(undefined, filter), fetchStats()]);
    setIsRefreshing(false);
  }, [fetchListings, fetchStats, filter]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchListings(nextCursor, filter);
    setIsLoadingMore(false);
  };

  const handleFilterChange = (f: FilterKey) => {
    if (f === filter) return;
    setFilter(f);
    setProperties([]);
    setNextCursor(undefined);
    setHasMore(false);
  };

  const renderFilters = () => (
    <View>
      {/* Stats Card */}
      {stats && (
        <View style={styles.statsCard}>
          {[
            { label: 'Total', value: stats.total, color: Colors.primary },
            { label: 'Available', value: stats.available, color: Colors.success },
            { label: 'Reserved', value: stats.reserved, color: Colors.warning },
            { label: 'Sold', value: stats.sold, color: Colors.error },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => handleFilterChange(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderListing = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => router.push(`/(realtor)/listings/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: item.images?.[0] }}
          style={styles.listingImage}
          contentFit="cover"
          placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
          transition={200}
        />
        <View style={styles.badgeOverlay}>
          <Badge label={item.availability} variant={availabilityVariant(item.availability)} size="sm" />
        </View>
        {item.isFeatured && (
          <View style={styles.featuredTag}>
            <Ionicons name="star" size={10} color={Colors.white} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.listingLocation} numberOfLines={1}>{item.city}, {item.state}</Text>
        </View>
        <Text style={styles.listingPrice}>{formatCurrency(item.price)}</Text>
        <View style={styles.listingMeta}>
          {item.bedrooms != null && (
            <View style={styles.metaItem}>
              <Ionicons name="bed-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.bedrooms}</Text>
            </View>
          )}
          {item.bathrooms != null && (
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.bathrooms}</Text>
            </View>
          )}
          {item.area != null && (
            <View style={styles.metaItem}>
              <Ionicons name="resize-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{item.area} sqm</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{item.viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Listings</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{properties.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(realtor)/add-listing' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={44} style={{ marginBottom: Spacing.lg }} />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={260} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, properties.length === 0 && styles.emptyListContent]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={renderFilters}
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="No Properties Found"
              description={filter === 'ALL' ? 'Properties will appear here once they are listed.' : `No ${filter.toLowerCase()} properties found.`}
            />
          }
          ListFooterComponent={isLoadingMore ? <View style={styles.footer}><ActivityIndicator size="small" color={Colors.primary} /></View> : null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: { ...Typography.captionMedium, color: Colors.primary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { ...Typography.captionMedium, color: Colors.white, fontWeight: '600' },
  statsCard: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    padding: Spacing.lg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.h4, fontWeight: '700' },
  statLabel: { ...Typography.small, color: Colors.textMuted },
  filterRow: { marginBottom: Spacing.md },
  filterContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.captionMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  emptyListContent: { flex: 1, justifyContent: 'center' },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
  listingCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  imageWrap: { position: 'relative' },
  listingImage: { width: '100%', height: 150 },
  badgeOverlay: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  featuredTag: {
    position: 'absolute', top: Spacing.sm, left: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warning, paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  featuredText: { ...Typography.small, color: Colors.white, fontWeight: '700' },
  listingContent: { padding: Spacing.lg },
  listingTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary, marginBottom: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: Spacing.xs },
  listingLocation: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  listingPrice: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.md },
  listingMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
