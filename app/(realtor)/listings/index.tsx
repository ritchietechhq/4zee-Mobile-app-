import React, { useEffect, useCallback, useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { propertyService } from '@/services/property.service';
import { Badge } from '@/components/ui/Badge';
import type { Property, PropertyAvailability } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export default function RealtorListings() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchListings = useCallback(async (cursor?: string) => {
    try {
      const result = await propertyService.search({
        limit: 15,
        cursor,
      });

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
      await fetchListings();
      setIsLoading(false);
    })();
  }, [fetchListings]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchListings();
    setIsRefreshing(false);
  }, [fetchListings]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchListings(nextCursor);
    setIsLoadingMore(false);
  };

  const getAvailabilityVariant = (availability: PropertyAvailability) => {
    switch (availability) {
      case 'AVAILABLE':
        return 'success';
      case 'SOLD':
        return 'error';
      case 'RESERVED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderListing = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => router.push(`/(client)/properties/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.images?.[0] }}
        style={styles.listingImage}
        contentFit="cover"
        placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
        transition={200}
      />
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Badge
            label={item.availability}
            variant={getAvailabilityVariant(item.availability)}
            size="sm"
          />
        </View>
        <Text style={styles.listingLocation} numberOfLines={1}>
          {item.city}, {item.state}
        </Text>
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
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{item.viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="home-outline" size={48} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Properties Found</Text>
      <Text style={styles.emptySubtitle}>
        Properties will appear here once they are listed.
      </Text>
    </View>
  );

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Listings</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            properties.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  listingImage: {
    width: '100%',
    height: 180,
  },
  listingContent: {
    padding: Spacing.lg,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  listingTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  listingLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  listingPrice: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  listingMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
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
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
