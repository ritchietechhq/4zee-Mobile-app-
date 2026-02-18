import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { propertyService } from '@/services/property.service';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Property, PropertyAvailability } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

type FilterTab = 'ALL' | PropertyAvailability;

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'RESERVED', label: 'Reserved' },
  { key: 'SOLD', label: 'Sold' },
];

const availabilityVariants: Record<PropertyAvailability, 'success' | 'error' | 'warning' | 'default'> = {
  AVAILABLE: 'success', SOLD: 'error', RESERVED: 'warning',
};

export default function RealtorListings() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const fetchListings = useCallback(async (cursor?: string) => {
    try {
      const result = await propertyService.search({
        limit: 15, cursor,
        ...(searchQuery ? { q: searchQuery } : {}),
        ...(filter !== 'ALL' ? { availability: filter } : {}),
      });
      const items = result.items || [];
      if (cursor) { setProperties((prev) => [...prev, ...items]); }
      else { setProperties(items); }
      setNextCursor(result.pagination?.nextCursor);
      setHasMore(result.pagination?.hasNext || false);
    } catch (e) { console.error('Failed to fetch listings:', e); }
  }, [filter, searchQuery]);

  useEffect(() => {
    (async () => { setIsLoading(true); await fetchListings(); setIsLoading(false); })();
  }, [fetchListings]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true); await fetchListings(); setIsRefreshing(false);
  }, [fetchListings]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true); await fetchListings(nextCursor); setIsLoadingMore(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearchQuery(text.trim()), 500);
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width="100%" height={180} borderRadius={0} />
          <View style={{ padding: Spacing.lg }}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="50%" height={14} style={{ marginTop: Spacing.sm }} />
            <Skeleton width="40%" height={22} style={{ marginTop: Spacing.sm }} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderListing = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => router.push(`/(realtor)/listings/${item.id}`)}
      activeOpacity={0.8}
    >
      <View>
        <Image
          source={{ uri: item.images?.[0] }}
          style={styles.listingImage}
          contentFit="cover"
          placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
          transition={200}
        />
        <View style={styles.imageBadge}>
          <Badge
            label={item.availability}
            variant={availabilityVariants[item.availability] || 'default'}
            size="sm"
          />
        </View>
        {item.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.listingLocation} numberOfLines={1}>{item.city}, {item.state}</Text>
        </View>
        <Text style={styles.listingPrice}>{formatCurrency(item.price)}</Text>
        <View style={styles.listingMeta}>
          {item.bedrooms != null && (
            <View style={styles.metaChip}>
              <Ionicons name="bed-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{item.bedrooms} Beds</Text>
            </View>
          )}
          {item.bathrooms != null && (
            <View style={styles.metaChip}>
              <Ionicons name="water-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{item.bathrooms} Baths</Text>
            </View>
          )}
          {item.area != null && (
            <View style={styles.metaChip}>
              <Ionicons name="resize-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{item.area} sqm</Text>
            </View>
          )}
          <View style={styles.viewCount}>
            <Ionicons name="eye-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.viewText}>{item.viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Listings</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{properties.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSearchQuery(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? renderSkeleton() : (
        <FlatList
          data={properties}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, properties.length === 0 && styles.emptyListContent]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="No Properties Found"
              description={search ? 'Try a different search term.' : 'Properties will appear here once listed.'}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  countBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  countText: { ...Typography.captionMedium, color: Colors.primary },
  searchWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary, paddingVertical: 4 },
  filtersRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  filterChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.captionMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  emptyListContent: { flex: 1, justifyContent: 'center' },
  skeletonWrap: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  skeletonCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.sm },
  listingCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.sm },
  listingImage: { width: '100%', height: 180 },
  imageBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  featuredBadge: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  featuredText: { ...Typography.small, color: Colors.warning, fontWeight: '600' },
  listingContent: { padding: Spacing.lg },
  listingTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  listingLocation: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  listingPrice: { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.md },
  listingMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.md },
  metaText: { ...Typography.small, color: Colors.textSecondary },
  viewCount: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  viewText: { ...Typography.small, color: Colors.textMuted },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
