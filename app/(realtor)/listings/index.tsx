import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePropertyStore } from '@/store/property.store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Property } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { propertyService } from '@/services/property.service';

export default function RealtorListings() {
  const { myListings, isLoading, fetchMyListings } = usePropertyStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchMyListings();
    setIsRefreshing(false);
  }, [fetchMyListings]);

  const handleDelete = (property: Property) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await propertyService.deleteProperty(property.id);
              fetchMyListings();
            } catch {
              Alert.alert('Error', 'Failed to delete listing. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'sold':
        return 'error';
      case 'reserved':
        return 'warning';
      case 'under_construction':
        return 'info';
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
            label={item.status.replace('_', ' ')}
            variant={getStatusVariant(item.status)}
            size="sm"
          />
        </View>
        <Text style={styles.listingLocation} numberOfLines={1}>
          {item.address?.city}, {item.address?.state}
        </Text>
        <Text style={styles.listingPrice}>{formatCurrency(item.price)}</Text>

        <View style={styles.listingMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="bed-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{item.bedrooms}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="water-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{item.bathrooms}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="resize-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{item.area} sqft</Text>
          </View>
        </View>

        <View style={styles.listingActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              router.push({
                pathname: '/(realtor)/listings/create' as any,
                params: { propertyId: item.id },
              })
            }
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="home-outline" size={48} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Listings Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start by creating your first property listing
      </Text>
      <Button
        title="Create Listing"
        onPress={() => router.push('/(realtor)/listings/create' as any)}
        icon="add-circle-outline"
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(realtor)/listings/create' as any)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={myListings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            myListings.length === 0 && styles.emptyListContent,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  listingActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  editButtonText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
  },
  deleteButtonText: {
    ...Typography.captionMedium,
    color: Colors.error,
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
});
