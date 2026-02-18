import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '@/store/property.store';
import { useApplications } from '@/hooks/useApplications';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedProperty: property,
    isLoadingDetail,
    fetchPropertyById,
    clearSelectedProperty,
  } = usePropertyStore();
  const { createApplication, isLoading: isApplying } = useApplications();
  const [isApplySuccess, setIsApplySuccess] = useState(false);

  useEffect(() => {
    if (id) fetchPropertyById(id);
    return () => clearSelectedProperty();
  }, [id]);

  if (isLoadingDetail || !property) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.title} - ${formatCurrency(property.price)}`,
      });
    } catch {
      // Silently fail
    }
  };

  const handleApply = async () => {
    try {
      const app = await createApplication(property.id);
      setIsApplySuccess(true);
      Alert.alert(
        'Application Submitted!',
        'Your application has been submitted successfully. You will be notified when it is reviewed.',
        [
          {
            text: 'View Application',
            onPress: () =>
              router.push({
                pathname: '/(client)/applications/[id]',
                params: { id: app.id },
              }),
          },
          { text: 'OK' },
        ],
      );
    } catch {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    }
  };

  const getAvailabilityVariant = (availability: string) => {
    switch (availability) {
      case 'AVAILABLE':
        return 'success' as const;
      case 'SOLD':
        return 'error' as const;
      case 'RESERVED':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <PropertyGallery images={property.images} height={320} />

        {/* Back & Actions overlay */}
        <SafeAreaView style={styles.overlayHeader} edges={['top']}>
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.overlayActions}>
            <TouchableOpacity style={styles.overlayButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Content */}
        <View style={styles.content}>
          {/* Price & Availability */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatCurrency(property.price)}
            </Text>
            <Badge
              label={property.availability}
              variant={getAvailabilityVariant(property.availability)}
              size="md"
            />
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.locationText}>
              {property.address}, {property.city}, {property.state}
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {property.bedrooms !== undefined && (
              <View style={styles.featureItem}>
                <Ionicons name="bed-outline" size={24} color={Colors.primary} />
                <Text style={styles.featureValue}>{property.bedrooms}</Text>
                <Text style={styles.featureLabel}>Bedrooms</Text>
              </View>
            )}
            {property.bathrooms !== undefined && (
              <View style={styles.featureItem}>
                <Ionicons name="water-outline" size={24} color={Colors.primary} />
                <Text style={styles.featureValue}>{property.bathrooms}</Text>
                <Text style={styles.featureLabel}>Bathrooms</Text>
              </View>
            )}
            {property.toilets !== undefined && (
              <View style={styles.featureItem}>
                <Ionicons name="flask-outline" size={24} color={Colors.primary} />
                <Text style={styles.featureValue}>{property.toilets}</Text>
                <Text style={styles.featureLabel}>Toilets</Text>
              </View>
            )}
            {property.area !== undefined && (
              <View style={styles.featureItem}>
                <Ionicons name="resize-outline" size={24} color={Colors.primary} />
                <Text style={styles.featureValue}>{property.area}</Text>
                <Text style={styles.featureLabel}>sqm</Text>
              </View>
            )}
            <View style={styles.featureItem}>
              <Ionicons name="home-outline" size={24} color={Colors.primary} />
              <Text style={styles.featureValue}>{property.type}</Text>
              <Text style={styles.featureLabel}>Type</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Property Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Info</Text>
            <Card variant="outlined" padding="lg">
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="eye-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoLabel}>Views</Text>
                  <Text style={styles.infoValue}>{property.viewCount}</Text>
                </View>
                {property.isFeatured && (
                  <View style={styles.infoItem}>
                    <Ionicons name="star" size={16} color={Colors.warning} />
                    <Text style={styles.infoLabel}>Featured</Text>
                    <Text style={styles.infoValue}>Yes</Text>
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoLabel}>Listed</Text>
                  <Text style={styles.infoValue}>
                    {new Date(property.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {property.availability === 'AVAILABLE' && (
        <View style={styles.bottomCTA}>
          <View style={styles.ctaPriceContainer}>
            <Text style={styles.ctaPriceLabel}>Price</Text>
            <Text style={styles.ctaPrice}>
              {formatCurrency(property.price)}
            </Text>
          </View>
          <Button
            title={isApplySuccess ? 'Applied ✓' : 'Apply Now'}
            onPress={handleApply}
            loading={isApplying}
            disabled={isApplySuccess}
            size="lg"
            style={styles.ctaButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  overlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  content: {
    padding: Spacing.xl,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.h2,
    color: Colors.primary,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  locationText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureItem: {
    alignItems: 'center',
    gap: 4,
  },
  featureValue: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  featureLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '47%',
  },
  amenityText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  infoValue: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
  },
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadows.lg,
  },
  ctaPriceContainer: {
    flex: 1,
  },
  ctaPriceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  ctaPrice: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  ctaButton: {
    flex: 1,
  },
});
