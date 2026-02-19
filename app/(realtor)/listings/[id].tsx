import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, FlatList, Share, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePropertyStore } from '@/store/property.store';
import { formatCurrency } from '@/utils/formatCurrency';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
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
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) fetchPropertyById(id);
    return () => clearSelectedProperty();
  }, [id]);

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out this property: ${property.title}\n${formatCurrency(property.price)}\n${property.city}, ${property.state}\n\nhttps://4zeeproperties.com/properties/${property.id}`,
        title: property.title,
      });
    } catch {}
  };

  if (isLoadingDetail || !property) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ padding: Spacing.xl }}>
          <Skeleton width="100%" height={260} style={{ borderRadius: BorderRadius.xl }} />
          <Skeleton width="80%" height={24} style={{ marginTop: Spacing.lg }} />
          <Skeleton width="50%" height={18} style={{ marginTop: Spacing.sm }} />
          <Skeleton width="40%" height={28} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  const images = property.images?.length ? property.images : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {images.length > 0 ? (
          <View>
            <FlatList
              ref={galleryRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.galleryImage} contentFit="cover" transition={200} />
              )}
            />
            {images.length > 1 && (
              <View style={styles.dotRow}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                ))}
              </View>
            )}
            <View style={styles.imageCount}>
              <Ionicons name="images-outline" size={14} color={Colors.white} />
              <Text style={styles.imageCountText}>{activeImage + 1}/{images.length}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.galleryImage, styles.noImage]}>
            <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
          </View>
        )}

        {/* Back + Share overlay */}
        <View style={styles.overlayRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title + Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
            <Badge
              label={property.availability}
              variant={property.availability === 'AVAILABLE' ? 'success' : property.availability === 'SOLD' ? 'error' : 'warning'}
            />
          </View>

          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.location}>{property.address || `${property.city}, ${property.state}`}</Text>
          </View>

          <Text style={styles.price}>{formatCurrency(property.price)}</Text>

          {/* Property type tag */}
          <View style={styles.typeTag}>
            <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
            <Text style={styles.typeText}>{property.type?.replace(/_/g, ' ')}</Text>
          </View>

          {/* Stats */}
          <Card variant="filled" padding="lg" style={styles.statsCard}>
            <View style={styles.statsRow}>
              {property.bedrooms != null && (
                <View style={styles.statItem}>
                  <Ionicons name="bed-outline" size={18} color={Colors.primary} />
                  <Text style={styles.statValue}>{property.bedrooms}</Text>
                  <Text style={styles.statLabel}>Beds</Text>
                </View>
              )}
              {property.bathrooms != null && (
                <View style={styles.statItem}>
                  <Ionicons name="water-outline" size={18} color={Colors.primary} />
                  <Text style={styles.statValue}>{property.bathrooms}</Text>
                  <Text style={styles.statLabel}>Baths</Text>
                </View>
              )}
              {property.toilets != null && (
                <View style={styles.statItem}>
                  <Ionicons name="cube-outline" size={18} color={Colors.primary} />
                  <Text style={styles.statValue}>{property.toilets}</Text>
                  <Text style={styles.statLabel}>Toilets</Text>
                </View>
              )}
              {property.area != null && (
                <View style={styles.statItem}>
                  <Ionicons name="resize-outline" size={18} color={Colors.primary} />
                  <Text style={styles.statValue}>{property.area}</Text>
                  <Text style={styles.statLabel}>sqm</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={18} color={Colors.primary} />
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
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesRow}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Card variant="outlined" padding="md">
              {[
                { label: 'Type', value: property.type?.replace(/_/g, ' ') },
                { label: 'Address', value: property.address },
                { label: 'City', value: property.city },
                { label: 'State', value: property.state },
                ...(property.location ? [{ label: 'Location', value: property.location }] : []),
              ].map((row, i, arr) => (
                <View key={i} style={[styles.detailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>{row.value}</Text>
                </View>
              ))}
            </Card>
          </View>

          {/* Virtual Tour */}
          {property.virtualTourUrl && (
            <Button
              title="View Virtual Tour"
              variant="outline"
              icon={<Ionicons name="videocam-outline" size={18} color={Colors.primary} />}
              onPress={() => Linking.openURL(property.virtualTourUrl!)}
              fullWidth
              style={{ marginBottom: Spacing.xl }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  galleryImage: { width, height: 240 },
  noImage: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dotRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    position: 'absolute', bottom: Spacing.md, left: 0, right: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: Colors.white, width: 20 },
  imageCount: {
    position: 'absolute', bottom: Spacing.md, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  imageCountText: { ...Typography.small, color: Colors.white, fontWeight: '600' },
  overlayRow: {
    position: 'absolute', top: 10, left: Spacing.xl, right: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  backButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadows.md,
  },
  content: { padding: Spacing.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  title: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  location: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  price: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.md },
  typeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, marginBottom: Spacing.xl,
  },
  typeText: { ...Typography.captionMedium, color: Colors.primary },
  statsCard: { marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  statLabel: { ...Typography.small, color: Colors.textTertiary },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full,
  },
  amenityText: { ...Typography.captionMedium, color: Colors.primary },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  detailLabel: { ...Typography.caption, color: Colors.textMuted },
  detailValue: { ...Typography.bodyMedium, color: Colors.textPrimary, textAlign: 'right', maxWidth: '60%' },
});
