import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Share, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '@/store/property.store';
import realtorService from '@/services/realtor.service';
import { formatCurrency } from '@/utils/formatCurrency';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedProperty: property,
    isLoadingDetail,
    fetchPropertyById,
    clearSelectedProperty,
  } = usePropertyStore();

  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (!id) return;
    router.push(`/(realtor)/edit-listing/${id}` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setIsDeleting(true);
            try {
              await realtorService.deleteListing(id);
              Alert.alert('Deleted', 'Listing has been removed.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              const msg = err?.error?.message || 'Failed to delete listing.';
              Alert.alert('Error', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoadingDetail || !property) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <PropertyGallery images={property.images || []} height={260} />

        {/* Back + Share overlay */}}
        <View style={styles.overlayRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
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
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={styles.location}>{property.address || `${property.city}, ${property.state}`}</Text>
          </View>

          <Text style={styles.price}>{formatCurrency(property.price)}</Text>

          {/* Property type tag */}
          <View style={styles.typeTag}>
            <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
            <Text style={styles.typeText}>{property.type?.replace(/_/g, ' ')}</Text>
          </View>

          {/* Stats */}
          <Card variant="filled" padding="lg" style={styles.statsCard}>
            <View style={styles.statsRow}>
              {property.bedrooms != null && (
                <View style={styles.statItem}>
                  <Ionicons name="bed-outline" size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{property.bedrooms}</Text>
                  <Text style={styles.statLabel}>Beds</Text>
                </View>
              )}
              {property.bathrooms != null && (
                <View style={styles.statItem}>
                  <Ionicons name="water-outline" size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{property.bathrooms}</Text>
                  <Text style={styles.statLabel}>Baths</Text>
                </View>
              )}
              {property.toilets != null && (
                <View style={styles.statItem}>
                  <Ionicons name="cube-outline" size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{property.toilets}</Text>
                  <Text style={styles.statLabel}>Toilets</Text>
                </View>
              )}
              {property.area != null && (
                <View style={styles.statItem}>
                  <Ionicons name="resize-outline" size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{property.area}</Text>
                  <Text style={styles.statLabel}>sqm</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={18} color={colors.primary} />
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
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
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

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button
              title="Edit Listing"
              variant="outline"
              icon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
              onPress={handleEdit}
              style={{ flex: 1 }}
            />
            <Button
              title={isDeleting ? 'Deleting...' : 'Delete'}
              variant="danger"
              icon={<Ionicons name="trash-outline" size={18} color={colors.white} />}
              onPress={handleDelete}
              loading={isDeleting}
              style={{ flex: 1 }}
            />
          </View>

          {/* Virtual Tour */}
          {property.virtualTourUrl && (
            <Button
              title="View Virtual Tour"
              variant="outline"
              icon={<Ionicons name="videocam-outline" size={18} color={colors.primary} />}
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  overlayRow: {
    position: 'absolute', top: 10, left: Spacing.xl, right: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  backButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center',
    ...Shadows.md,
  },
  content: { padding: Spacing.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs },
  title: { ...Typography.h3, color: colors.textPrimary, flex: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  location: { ...Typography.body, color: colors.textSecondary, flex: 1 },
  price: { ...Typography.h3, color: colors.primary, marginBottom: Spacing.md },
  typeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, marginBottom: Spacing.xl,
  },
  typeText: { ...Typography.captionMedium, color: colors.primary },
  statsCard: { marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { ...Typography.bodySemiBold, color: colors.textPrimary },
  statLabel: { ...Typography.small, color: colors.textTertiary },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.md },
  description: { ...Typography.body, color: colors.textSecondary, lineHeight: 22 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: BorderRadius.full,
  },
  amenityText: { ...Typography.captionMedium, color: colors.primary },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  detailLabel: { ...Typography.caption, color: colors.textMuted },
  detailValue: { ...Typography.bodyMedium, color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
});
