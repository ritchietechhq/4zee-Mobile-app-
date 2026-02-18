import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePropertyStore } from '@/store/property.store';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterChip } from '@/components/ui/FilterChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { PropertyType, PropertySearchFilters } from '@/types';

const TYPES: { label: string; value: PropertyType | undefined; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: undefined, icon: 'apps-outline' },
  { label: 'House', value: 'HOUSE', icon: 'home-outline' },
  { label: 'Apartment', value: 'APARTMENT', icon: 'business-outline' },
  { label: 'Land', value: 'LAND', icon: 'layers-outline' },
  { label: 'Commercial', value: 'COMMERCIAL', icon: 'storefront-outline' },
];

const SORT_OPTIONS: { label: string; value: PropertySearchFilters['sortBy']; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Newest', value: 'createdAt', icon: 'time-outline' },
  { label: 'Price', value: 'price', icon: 'pricetag-outline' },
  { label: 'Popular', value: 'viewCount', icon: 'trending-up-outline' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const {
    properties, isLoading, isLoadingMore, isRefreshing, hasMore,
    searchProperties, loadMore, refresh, setFilters, filters,
  } = usePropertyStore();

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<PropertyType | undefined>(undefined);
  const [activeSort, setActiveSort] = useState<PropertySearchFilters['sortBy']>('createdAt');
  const [isGridView, setIsGridView] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { searchProperties(); }, []);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters({ q: text || undefined });
      searchProperties({ ...filters, q: text || undefined });
    }, 400);
  }, [filters]);

  const handleTypeFilter = (type: PropertyType | undefined) => {
    setActiveType(type);
    setFilters({ type });
    searchProperties({ ...filters, type });
  };

  const handleSortChange = (sortBy: PropertySearchFilters['sortBy']) => {
    setActiveSort(sortBy);
    setFilters({ sortBy });
    searchProperties({ ...filters, sortBy });
  };

  const clearSearch = () => {
    setQuery('');
    setActiveType(undefined);
    setActiveSort('createdAt');
    searchProperties({});
    Keyboard.dismiss();
  };

  const handleEndReached = () => { if (hasMore && !isLoadingMore) loadMore(); };

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: Spacing.xxxxl }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        icon="search-outline"
        title="No properties found"
        description="Try adjusting your filters or search terms."
        actionLabel="Clear Filters"
        onAction={clearSearch}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Search Header ── */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchInputWrap, isFocused && styles.searchInputFocused]}>
          <Ionicons name="search-outline" size={20} color={isFocused ? Colors.primary : Colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search location, type, keyword..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.viewToggle} onPress={() => setIsGridView(!isGridView)} activeOpacity={0.7}>
          <Ionicons name={isGridView ? 'list-outline' : 'grid-outline'} size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Type Filters ── */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={TYPES} keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.typeChip, activeType === item.value && styles.typeChipActive]}
              onPress={() => handleTypeFilter(item.value)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={15} color={activeType === item.value ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.typeChipText, activeType === item.value && styles.typeChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Sort Row ── */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>
          {isLoading ? 'Searching...' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
        </Text>
        <View style={styles.sortChips}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortChip, activeSort === opt.value && styles.sortChipActive]}
              onPress={() => handleSortChange(opt.value)}
              activeOpacity={0.7}
            >
              <Ionicons name={opt.icon} size={13} color={activeSort === opt.value ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.sortChipText, activeSort === opt.value && styles.sortChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Results ── */}
      {isLoading && properties.length === 0 ? (
        <SearchSkeleton isGrid={isGridView} />
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          data={properties}
          numColumns={isGridView ? 2 : 1}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={isGridView ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <View style={isGridView ? styles.gridItem : styles.listItem}>
              <PropertyCard property={item} variant={isGridView ? 'vertical' : 'horizontal'} />
            </View>
          )}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

function SearchSkeleton({ isGrid }: { isGrid: boolean }) {
  if (isGrid) {
    return (
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonGridItem}>
            <Skeleton width="100%" height={140} borderRadius={BorderRadius.lg} />
            <View style={{ padding: Spacing.sm }}>
              <Skeleton width="60%" height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="80%" height={10} />
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.skeletonList}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonListItem}>
          <Skeleton width={120} height={100} borderRadius={BorderRadius.lg} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Skeleton width="70%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: Spacing.sm },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, height: 48, borderWidth: 1.5, borderColor: Colors.borderLight },
  searchInputFocused: { borderColor: Colors.primary, backgroundColor: Colors.white },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary, marginLeft: Spacing.sm, paddingVertical: 0 },
  viewToggle: { width: 48, height: 48, borderRadius: BorderRadius.xl, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },

  filterRow: { marginBottom: Spacing.sm },
  filterList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.borderLight },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { ...Typography.captionMedium, color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.white },

  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  resultCount: { ...Typography.captionMedium, color: Colors.textSecondary },
  sortChips: { flexDirection: 'row', gap: Spacing.xs },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 1, borderRadius: BorderRadius.full, backgroundColor: Colors.surface },
  sortChipActive: { backgroundColor: Colors.primaryLight },
  sortChipText: { ...Typography.small, color: Colors.textMuted },
  sortChipTextActive: { color: Colors.primary, fontWeight: '600' },

  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxxl },
  listItem: { marginBottom: Spacing.sm },
  gridRow: { justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: Spacing.md },

  footerLoader: { paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.xs },
  loadingMoreText: { ...Typography.small, color: Colors.textMuted },

  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  skeletonGridItem: { width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.sm, marginBottom: Spacing.md },
  skeletonList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  skeletonListItem: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.sm },
});

