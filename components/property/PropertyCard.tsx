import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { Property } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import { formatCurrency } from '@/utils/formatCurrency';
import favoritesService from '@/services/favorites.service';
import { showFavouriteToast } from '@/components/ui/FavouriteToast';

interface PropertyCardProps {
  property: Property;
  variant?: 'horizontal' | 'vertical';
  isFavorite?: boolean;
  onFavoriteChange?: (propertyId: string, isFavorite: boolean) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PropertyCard({ property, variant = 'vertical', isFavorite: initialFavorite, onFavoriteChange }: PropertyCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isFavorite, setIsFavorite] = useState(initialFavorite ?? false);
  const [isToggling, setIsToggling] = useState(false);

  const handlePress = () => { router.push(`/properties/${property.id}`); };

  const handleToggleFavorite = useCallback(async (e?: any) => {
    e?.stopPropagation?.();
    if (isToggling) return;
    setIsToggling(true);
    const optimistic = !isFavorite;
    setIsFavorite(optimistic); // Optimistic update
    try {
      const result = await favoritesService.toggle(property.id);
      setIsFavorite(result.isFavorite); // Sync with server
      onFavoriteChange?.(property.id, result.isFavorite);
      showFavouriteToast({ title: property.title, action: result.action });
    } catch (error) {
      setIsFavorite(!optimistic); // Revert on error
      Alert.alert('Error', 'Failed to update favourite');
    } finally {
      setIsToggling(false);
    }
  }, [isFavorite, isToggling, property.id, onFavoriteChange]);

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
              <Ionicons name="location" size={13} color={colors.primary} />
              <Text style={styles.location} numberOfLines={1}>{property.city}, {property.state}</Text>
            </View>
            <Text style={styles.hPrice}>{formatCurrency(property.price)}</Text>
            <View style={styles.featuresRow}>
              {property.bedrooms != null && (
                <View style={styles.feature}>
                  <Ionicons name="bed-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.featureText}>{property.bedrooms}</Text>
                </View>
              )}
              {property.bathrooms != null && (
                <View style={styles.feature}>
                  <Ionicons name="water-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.featureText}>{property.bathrooms}</Text>
                </View>
              )}
              {property.area != null && (
                <View style={styles.feature}>
                  <Ionicons name="resize-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.featureText}>{property.area} sqm</Text>
                </View>
              )}
            </View>
          </View>
          {/* Favourite button on the right */}
          <TouchableOpacity
            style={[styles.hFavBtn, isFavorite && styles.hFavBtnActive]}
            activeOpacity={0.7}
            onPress={handleToggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.error : colors.textMuted}
            />
          </TouchableOpacity>
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
            <TouchableOpacity style={[styles.saveBtn, isFavorite && styles.saveBtnActive]} activeOpacity={0.7} onPress={handleToggleFavorite}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? colors.error : colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.priceOnImage}>
            <Text style={styles.vPriceText}>{formatCurrency(property.price)}</Text>
          </View>
        </View>
        <View style={styles.verticalContent}>
          <Text style={styles.vTitle} numberOfLines={1}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={colors.primary} />
            <Text style={styles.location} numberOfLines={1}>{property.city}, {property.state}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featuresRow}>
            {property.bedrooms != null && (
              <View style={styles.feature}>
                <Ionicons name="bed-outline" size={15} color={colors.textMuted} />
                <Text style={styles.featureText}>{property.bedrooms} Beds</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.feature}>
                <Ionicons name="water-outline" size={15} color={colors.textMuted} />
                <Text style={styles.featureText}>{property.bathrooms} Baths</Text>
              </View>
            )}
            {property.area != null && (
              <View style={styles.feature}>
                <Ionicons name="resize-outline" size={15} color={colors.textMuted} />
                <Text style={styles.featureText}>{property.area} sqm</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  // Vertical card
  verticalCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...Shadows.md },
  imageContainer: { position: 'relative' },
  verticalImage: { width: '100%', height: 180, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  imageOverlay: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, right: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  saveBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  saveBtnActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  priceOnImage: { position: 'absolute', bottom: Spacing.sm, left: Spacing.sm },
  vPriceText: { ...Typography.bodySemiBold, color: colors.white, fontSize: 17 },
  verticalContent: { padding: Spacing.md },
  vTitle: { ...Typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },

  // Horizontal card
  horizontalCard: { flexDirection: 'row', backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.sm, borderWidth: 1, borderColor: colors.borderLight, ...Shadows.sm },
  horizontalImageWrap: { position: 'relative' },
  horizontalImage: { width: 130, height: 130 },
  horizontalBadge: { position: 'absolute', top: Spacing.xs, left: Spacing.xs },
  horizontalContent: { flex: 1, padding: Spacing.md, justifyContent: 'center', paddingRight: Spacing.xs },
  hTitle: { ...Typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
  hPrice: { ...Typography.bodySemiBold, color: colors.primary, marginBottom: Spacing.xs },
  hFavBtn: { position: 'absolute', right: Spacing.sm, top: Spacing.sm, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  hFavBtnActive: { backgroundColor: colors.errorLight, borderColor: colors.error },

  // Common
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  location: { ...Typography.caption, color: colors.textMuted, flex: 1 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: Spacing.sm },
  featuresRow: { flexDirection: 'row', gap: Spacing.lg },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureText: { ...Typography.caption, color: colors.textMuted },
});
