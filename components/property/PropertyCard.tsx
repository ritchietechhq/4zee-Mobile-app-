import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Property } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';

interface PropertyCardProps {
  property: Property;
  variant?: 'horizontal' | 'vertical';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PropertyCard({ property, variant = 'vertical' }: PropertyCardProps) {
  const handlePress = () => { router.push(`/properties/${property.id}`); };

  const availabilityVariant =
    property.availability === 'AVAILABLE' ? 'success'
    : property.availability === 'RESERVED' ? 'warning'
    : property.availability === 'SOLD' ? 'error' : 'info';

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <View style={styles.horizontalCard}>
          <View style={styles.horizontalImageWrap}>
            <Image
              source={{ uri: property.images?.[0] }}
              style={styles.horizontalImage}
              contentFit="cover"
              placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              transition={200}
            />
            <View style={styles.horizontalBadge}>
              <Badge label={property.type} variant="info" size="sm" />
            </View>
          </View>
          <View style={styles.horizontalContent}>
            <Text style={styles.hTitle} numberOfLines={1}>{property.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color={Colors.primary} />
              <Text style={styles.location} numberOfLines={1}>{property.city}, {property.state}</Text>
            </View>
            <Text style={styles.hPrice}>{formatCurrency(property.price)}</Text>
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
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.verticalCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: property.images?.[0] }}
            style={styles.verticalImage}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={200}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={styles.imageGradient} />
          <View style={styles.imageOverlay}>
            <Badge label={property.availability} variant={availabilityVariant} />
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.priceOnImage}>
            <Text style={styles.vPriceText}>{formatCurrency(property.price)}</Text>
          </View>
        </View>
        <View style={styles.verticalContent}>
          <Text style={styles.vTitle} numberOfLines={1}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={Colors.primary} />
            <Text style={styles.location} numberOfLines={1}>{property.city}, {property.state}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featuresRow}>
            {property.bedrooms != null && (
              <View style={styles.feature}>
                <Ionicons name="bed-outline" size={15} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.bedrooms} Beds</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.feature}>
                <Ionicons name="water-outline" size={15} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.bathrooms} Baths</Text>
              </View>
            )}
            {property.area != null && (
              <View style={styles.feature}>
                <Ionicons name="resize-outline" size={15} color={Colors.textMuted} />
                <Text style={styles.featureText}>{property.area} sqm</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Vertical card
  verticalCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.md },
  imageContainer: { position: 'relative' },
  verticalImage: { width: '100%', height: 180, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  imageOverlay: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, right: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  saveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  priceOnImage: { position: 'absolute', bottom: Spacing.sm, left: Spacing.sm },
  vPriceText: { ...Typography.bodySemiBold, color: Colors.white, fontSize: 17 },
  verticalContent: { padding: Spacing.md },
  vTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: 4 },

  // Horizontal card
  horizontalCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  horizontalImageWrap: { position: 'relative' },
  horizontalImage: { width: 130, height: 130 },
  horizontalBadge: { position: 'absolute', top: Spacing.xs, left: Spacing.xs },
  horizontalContent: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  hTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: 4 },
  hPrice: { ...Typography.bodySemiBold, color: Colors.primary, marginBottom: Spacing.xs },

  // Common
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  location: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },
  featuresRow: { flexDirection: 'row', gap: Spacing.lg },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureText: { ...Typography.caption, color: Colors.textMuted },
});
