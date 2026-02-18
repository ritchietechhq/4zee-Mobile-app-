import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePropertyStore } from '@/store/property.store';
import { formatCurrency } from '@/utils/formatCurrency';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedProperty: property,
    isLoadingDetail,
    fetchPropertyById,
    clearSelectedProperty,
  } = usePropertyStore();

  useEffect(() => {
    if (id) fetchPropertyById(id);
    return () => clearSelectedProperty();
  }, [id]);

  if (isLoadingDetail || !property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        {property.images?.[0] && (
          <Image
            source={{ uri: property.images[0] }}
            style={styles.image}
            contentFit="cover"
          />
        )}

        {/* Back button overlay */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            <Badge
              label={property.availability}
              variant={
                property.availability === 'AVAILABLE'
                  ? 'success'
                  : property.availability === 'SOLD'
                  ? 'error'
                  : 'warning'
              }
            />
          </View>

          <Text style={styles.location}>
            {property.city}, {property.state}
          </Text>
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {property.bedrooms != null && (
              <View style={styles.statItem}>
                <Ionicons name="bed-outline" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{property.bedrooms}</Text>
                <Text style={styles.statLabel}>Beds</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.statItem}>
                <Ionicons name="water-outline" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{property.bathrooms}</Text>
                <Text style={styles.statLabel}>Baths</Text>
              </View>
            )}
            {property.toilets != null && (
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{property.toilets}</Text>
                <Text style={styles.statLabel}>Toilets</Text>
              </View>
            )}
            {property.area != null && (
              <View style={styles.statItem}>
                <Ionicons name="resize-outline" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{property.area}</Text>
                <Text style={styles.statLabel}>sqm</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{property.viewCount}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesRow}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Type & Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{property.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{property.address}</Text>
            </View>
            {property.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{property.location}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width,
    height: 260,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  content: {
    padding: Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  location: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  amenityText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
});
