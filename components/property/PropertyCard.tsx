import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Property } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';

interface PropertyCardProps {
  property: Property;
  variant?: 'horizontal' | 'vertical';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

export function PropertyCard({
  property,
  variant = 'vertical',
}: PropertyCardProps) {
  const handlePress = () => {
    router.push(`/(client)/properties/${property.id}`);
  };

  const availabilityVariant =
    property.availability === 'AVAILABLE'
      ? 'success'
      : property.availability === 'RESERVED'
        ? 'warning'
        : property.availability === 'SOLD'
          ? 'error'
          : 'info';

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Card style={styles.horizontalCard}>
          <Image
            source={{ uri: property.images?.[0] }}
            style={styles.horizontalImage}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={200}
          />
          <View style={styles.horizontalContent}>
            <Text style={styles.title} numberOfLines={1}>
              {property.title}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.location} numberOfLines={1}>
                {property.city}, {property.state}
              </Text>
            </View>
            <Text style={styles.price}>{formatCurrency(property.price)}</Text>
            <View style={styles.featuresRow}>
              {property.bedrooms != null && (
                <View style={styles.feature}>
                  <Ionicons name="bed-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.featureText}>{property.bedrooms}</Text>
                </View>
              )}
              {property.bathrooms != null && (
                <View style={styles.feature}>
                  <Ionicons name="water-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.featureText}>{property.bathrooms}</Text>
                </View>
              )}
              {property.area != null && (
                <View style={styles.feature}>
                  <Ionicons name="resize-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.featureText}>{property.area} sqm</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Card style={styles.verticalCard} padding="xs">
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: property.images?.[0] }}
            style={styles.verticalImage}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={200}
          />
          <View style={styles.imageOverlay}>
            <Badge label={property.availability} variant={availabilityVariant} />
          </View>
        </View>

        <View style={styles.verticalContent}>
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {property.city}, {property.state}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featuresRow}>
            {property.bedrooms != null && (
              <View style={styles.feature}>
                <Ionicons name="bed-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.bedrooms} Beds</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.feature}>
                <Ionicons name="water-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.bathrooms} Baths</Text>
              </View>
            )}
            {property.area != null && (
              <View style={styles.feature}>
                <Ionicons name="resize-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.area} sqm</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Vertical card
  verticalCard: {
    width: CARD_WIDTH,
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    position: 'relative',
  },
  verticalImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verticalContent: {
    padding: Spacing.md,
  },

  // Horizontal card
  horizontalCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  horizontalImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },

  // Common
  title: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  price: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  location: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
