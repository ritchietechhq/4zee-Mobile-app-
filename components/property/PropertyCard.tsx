import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Property } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';

interface PropertyCardProps {
  property: Property;
  onFavoritePress?: (id: string) => void;
  variant?: 'horizontal' | 'vertical';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

export function PropertyCard({
  property,
  onFavoritePress,
  variant = 'vertical',
}: PropertyCardProps) {
  const handlePress = () => {
    router.push(`/(client)/properties/${property.id}`);
  };

  const statusVariant =
    property.status === 'available'
      ? 'success'
      : property.status === 'reserved'
        ? 'warning'
        : property.status === 'sold'
          ? 'error'
          : 'info';

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Card style={styles.horizontalCard}>
          <Image
            source={{ uri: property.images[0] }}
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
                {property.address.city}, {property.address.state}
              </Text>
            </View>
            <Text style={styles.price}>
              {formatCurrency(property.price, property.currency)}
            </Text>
            <View style={styles.featuresRow}>
              <View style={styles.feature}>
                <Ionicons name="bed-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.bedrooms}</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="water-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.bathrooms}</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="resize-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.featureText}>
                  {property.area} {property.areaUnit}
                </Text>
              </View>
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
            source={{ uri: property.images[0] }}
            style={styles.verticalImage}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={200}
          />
          <View style={styles.imageOverlay}>
            <Badge label={property.status.replace('_', ' ')} variant={statusVariant} />
            {onFavoritePress && (
              <TouchableOpacity
                onPress={() => onFavoritePress(property.id)}
                style={styles.favoriteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={property.isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={property.isFavorite ? Colors.error : Colors.white}
                />
              </TouchableOpacity>
            )}
          </View>
          {property.installmentAvailable && (
            <View style={styles.installmentBadge}>
              <Text style={styles.installmentText}>Installment Available</Text>
            </View>
          )}
        </View>

        <View style={styles.verticalContent}>
          <Text style={styles.price}>
            {formatCurrency(property.price, property.currency)}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {property.address.city}, {property.address.state}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <Ionicons name="bed-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.featureText}>{property.bedrooms} Beds</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="water-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.featureText}>{property.bathrooms} Baths</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="resize-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.featureText}>
                {property.area} {property.areaUnit}
              </Text>
            </View>
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
    height: 200,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installmentBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  installmentText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalContent: {
    padding: Spacing.lg,
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

  // Shared
  title: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  price: {
    ...Typography.h4,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  location: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

export default PropertyCard;
