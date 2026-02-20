import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
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
import { useTheme } from '@/hooks/useTheme';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterChip } from '@/components/ui/FilterChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
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
  const { colors } = useTheme();
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

  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

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
      <View style={dynamicStyles.footerLoader}>
        <ActivityIndicator color={colors.primary} />
        <Text style={dynamicStyles.loadingMoreText}>Loading more...</Text>
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
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* ── Search Header ── */}
      <View style={dynamicStyles.searchHeader}>
        <View style={[dynamicStyles.searchInputWrap, isFocused && dynamicStyles.searchInputFocused]}>
          <Ionicons name="search-outline" size={20} color={isFocused ? colors.primary : colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[dynamicStyles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search location, type, keyword..."
            placeholderTextColor={colors.textMuted}
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
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={dynamicStyles.viewToggle} onPress={() => setIsGridView(!isGridView)} activeOpacity={0.7}>
          <Ionicons name={isGridView ? 'list-outline' : 'grid-outline'} size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Type Filters ── */}
      <View style={dynamicStyles.filterRow}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={TYPES} keyExtractor={(item) => item.label}
          contentContainerStyle={dynamicStyles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[dynamicStyles.typeChip, activeType === item.value && dynamicStyles.typeChipActive]}
              onPress={() => handleTypeFilter(item.value)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={15} color={activeType === item.value ? colors.white : colors.textSecondary} />
              <Text style={[dynamicStyles.typeChipText, activeType === item.value && dynamicStyles.typeChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Sort Row ── */}
      <View style={dynamicStyles.sortRow}>
        <Text style={dynamicStyles.resultCount}>
          {isLoading ? 'Searching...' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
        </Text>
        <View style={dynamicStyles.sortChips}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[dynamicStyles.sortChip, activeSort === opt.value && dynamicStyles.sortChipActive]}
              onPress={() => handleSortChange(opt.value)}
              activeOpacity={0.7}
            >
              <Ionicons name={opt.icon} size={13} color={activeSort === opt.value ? colors.primary : colors.textMuted} />
              <Text style={[dynamicStyles.sortChipText, activeSort === opt.value && dynamicStyles.sortChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Results ── */}
      {isLoading && properties.length === 0 ? (
        <SearchSkeleton isGrid={isGridView} colors={colors} />
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          data={properties}
          numColumns={isGridView ? 2 : 1}
          keyExtractor={(item) => item.id}
          contentContainerStyle={dynamicStyles.listContent}
          columnWrapperStyle={isGridView ? dynamicStyles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={isGridView ? dynamicStyles.gridItem : dynamicStyles.listItem}>
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

function SearchSkeleton({ isGrid, colors }: { isGrid: boolean; colors: any }) {
  const skeletonStyles = useMemo(() => createSkeletonStyles(colors), [colors]);
  if (isGrid) {
    return (
      <View style={skeletonStyles.skeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={skeletonStyles.skeletonGridItem}>
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
    <View style={skeletonStyles.skeletonList}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={skeletonStyles.skeletonListItem}>
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: Spacing.sm },
    searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, height: 48, borderWidth: 1.5, borderColor: colors.border },
    searchInputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
    searchInput: { flex: 1, ...Typography.body, marginLeft: Spacing.sm, paddingVertical: 0 },
    viewToggle: { width: 48, height: 48, borderRadius: BorderRadius.xl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    filterRow: { marginBottom: Spacing.sm },
    filterList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
    typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeChipText: { ...Typography.captionMedium, color: colors.textSecondary },
    typeChipTextActive: { color: colors.white },
    sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
    resultCount: { ...Typography.captionMedium, color: colors.textSecondary },
    sortChips: { flexDirection: 'row', gap: Spacing.xs },
    sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 1, borderRadius: BorderRadius.full, backgroundColor: colors.surface },
    sortChipActive: { backgroundColor: colors.primaryLight },
    sortChipText: { ...Typography.small, color: colors.textMuted },
    sortChipTextActive: { color: colors.primary, fontWeight: '600' },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxxl },
    listItem: { marginBottom: Spacing.sm },
    gridRow: { justifyContent: 'space-between' },
    gridItem: { width: '48%', marginBottom: Spacing.md },
    footerLoader: { paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.xs },
    loadingMoreText: { ...Typography.small, color: colors.textMuted },
  });

const createSkeletonStyles = (colors: any) =>
  StyleSheet.create({
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, gap: Spacing.md },
    skeletonGridItem: { width: '48%', backgroundColor: colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...Shadows.sm, marginBottom: Spacing.md },
    skeletonList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    skeletonListItem: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: colors.border, ...Shadows.sm },
  });

