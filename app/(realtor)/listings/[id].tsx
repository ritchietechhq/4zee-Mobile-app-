import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Share, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePropertyStore } from '@/store/property.store';
import { formatCurrency } from '@/utils/formatCurrency';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedProperty: property, isLoadingDetail, fetchPropertyById, clearSelectedProperty } = usePropertyStore();
  const [activeImage, setActiveImage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) fetchPropertyById(id);
    return () => clearSelectedProperty();
  }, [id]);

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out this property: ${property.title}\n${formatCurrency(property.price)}\n${property.city}, ${property.state}`,
        title: property.title,
      });
    } catch {}
  };

  if (isLoadingDetail || !property) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="80%" height={24} />
            <Skeleton width="60%" height={16} style={{ marginTop: Spacing.sm }} />
            <Skeleton width="40%" height={28} style={{ marginTop: Spacing.md }} />
            <Skeleton width="100%" height={80} style={{ marginTop: Spacing.xl }} />
            <Skeleton width="100%" height={120} style={{ marginTop: Spacing.lg }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const images = property.images || [];
  const availabilityVariant = property.availability === 'AVAILABLE' ? 'success' : property.availability === 'SOLD' ? 'error' : 'warning';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View>
          {images.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveImage(idx);
                }}
                renderItem={({ item: uri }) => (
                  <Image source={{ uri }} style={styles.carouselImage} contentFit="cover" transition={200} />
                )}
              />
              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                  ))}
                </View>
              )}
              <View style={styles.imageCounter}>
                <Ionicons name="images-outline" size={14} color={Colors.white} />
                <Text style={styles.imageCounterText}>{activeImage + 1}/{images.length}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.carouselImage, styles.noImage]}>
              <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {/* Overlay nav */}
        <View style={styles.overlayNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title & Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
            <Badge label={property.availability} variant={availabilityVariant} />
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.location}>{property.address || `${property.city}, ${property.state}`}</Text>
          </View>

          <Text style={styles.price}>{formatCurrency(property.price)}</Text>

          {/* Stats */}
          <Card variant="filled" padding="lg" style={styles.statsCard}>
            <View style={styles.statsRow}>
              {property.bedrooms != null && (
                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Ionicons name="bed-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{property.bedrooms}</Text>
                  <Text style={styles.statLabel}>Bedrooms</Text>
                </View>
              )}
              {property.bathrooms != null && (
                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Ionicons name="water-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{property.bathrooms}</Text>
                  <Text style={styles.statLabel}>Bathrooms</Text>
                </View>
              )}
              {property.toilets != null && (
                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Ionicons name="cube-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{property.toilets}</Text>
                  <Text style={styles.statLabel}>Toilets</Text>
                </View>
              )}
              {property.area != null && (
                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Ionicons name="resize-outline" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{property.area}</Text>
                  <Text style={styles.statLabel}>sqm</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Ionicons name="eye-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{property.viewCount}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
            </View>
          </Card>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesRow}>
                {property.amenities.map((a, i) => (
                  <View key={i} style={styles.amenityChip}>
                    <Ionicons name="checkmark" size={14} color={Colors.primary} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <Card variant="outlined" padding="md">
              {[
                { label: 'Type', value: property.type },
                { label: 'Location', value: property.location },
                { label: 'City', value: property.city },
                { label: 'State', value: property.state },
                ...(property.address ? [{ label: 'Address', value: property.address }] : []),
              ].filter(d => d.value).map((d, i, arr) => (
                <View key={i} style={[styles.detailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>{d.value}</Text>
                </View>
              ))}
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skeletonWrap: { flex: 1 },
  carouselImage: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
  noImage: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: Colors.white, width: 20 },
  imageCounter: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  imageCounterText: { ...Typography.small, color: Colors.white },
  overlayNav: { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  content: { padding: Spacing.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  title: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  location: { ...Typography.body, color: Colors.textMuted, flex: 1 },
  price: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.xl },
  statsCard: { marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  statValue: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  statLabel: { ...Typography.small, color: Colors.textMuted },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full },
  amenityText: { ...Typography.captionMedium, color: Colors.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailLabel: { ...Typography.caption, color: Colors.textMuted },
  detailValue: { ...Typography.bodyMedium, color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});
