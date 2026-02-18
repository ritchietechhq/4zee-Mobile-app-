import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '@/store/property.store';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { PropertyType } from '@/types';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const PROPERTY_TYPES: { value: PropertyType | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'LAND', label: 'Land' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

export default function PropertyListingScreen() {
  const {
    properties,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    filters,
    searchProperties,
    loadMore,
    refresh,
    setFilters,
    resetFilters,
  } = usePropertyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<PropertyType | undefined>();

  useEffect(() => {
    searchProperties();
  }, []);

  const handleSearch = useCallback(() => {
    searchProperties({ ...filters, q: searchQuery.trim() || undefined });
  }, [searchQuery, filters, searchProperties]);

  const handleTypeFilter = useCallback(
    (type: PropertyType | undefined) => {
      setSelectedType(type);
      searchProperties({ ...filters, type });
    },
    [filters, searchProperties],
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType(undefined);
    resetFilters();
    searchProperties();
    setShowFilters(false);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Type Pills */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={PROPERTY_TYPES}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.typePills}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.pill,
              selectedType === item.value && styles.pillActive,
            ]}
            onPress={() => handleTypeFilter(item.value)}
          >
            <Text
              style={[
                styles.pillText,
                selectedType === item.value && styles.pillTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No properties found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search or filters
        </Text>
        <Button
          title="Clear Filters"
          variant="outline"
          onPress={handleClearFilters}
          style={styles.clearButton}
        />
      </View>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleBar}>
        <Text style={styles.screenTitle}>Properties</Text>
        <Text style={styles.countText}>
          {properties.length} results
        </Text>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <PropertyCard property={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        size="lg"
      >
        <View style={styles.filterContent}>
          <Text style={styles.filterLabel}>Property Type</Text>
          <View style={styles.filterGrid}>
            {PROPERTY_TYPES.slice(1).map((type) => (
              <TouchableOpacity
                key={type.label}
                style={[
                  styles.filterChip,
                  selectedType === type.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === type.value && styles.filterChipTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterActions}>
            <Button
              title="Clear All"
              variant="outline"
              onPress={handleClearFilters}
              style={styles.filterActionButton}
            />
            <Button
              title="Apply"
              onPress={() => {
                searchProperties({ ...filters, type: selectedType });
                setShowFilters(false);
              }}
              style={styles.filterActionButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  screenTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  countText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  cardContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePills: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  clearButton: {
    marginTop: Spacing.xl,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  // Filter modal
  filterContent: {
    gap: Spacing.lg,
  },
  filterLabel: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  filterActionButton: {
    flex: 1,
  },
});
