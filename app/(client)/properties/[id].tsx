import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePropertyStore } from '@/store/property.store';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Property } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { selectedProperty: property, isLoadingDetail, fetchPropertyById, clearSelectedProperty } = usePropertyStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) fetchPropertyById(id);
    return () => clearSelectedProperty();
  }, [id]);

  useEffect(() => {
    if (property) {
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
    }
  }, [property]);

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({ message: `Check out "${property.title}" on 4Zee Properties — ${formatCurrency(property.price)}` });
    } catch { /* noop */ }
  };

  if (isLoadingDetail || !property) {
    return (
      <View style={[styles.loaderWrap, { paddingTop: insets.top }]}>
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading property...</Text>
        </View>
      </View>
    );
  }

  const availabilityVariant =
    property.availability === 'AVAILABLE' ? 'success'
    : property.availability === 'RESERVED' ? 'warning' : 'error';

  return (
    <View style={styles.container}>
      {/* ── Floating header ── */}
      <View style={[styles.floatingHeader, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => { /* TODO: toggle save */ }}>
            <Ionicons name="heart-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Gallery ── */}
        <PropertyGallery images={property.images} height={320} />

        <Animated.View style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          {/* ── Price + Badge ── */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatCurrency(property.price)}</Text>
              <Text style={styles.priceLabel}>Total price</Text>
            </View>
            <Badge label={property.availability} variant={availabilityVariant} size="md" />
          </View>

          {/* ── Title & Location ── */}
          <Text style={styles.title}>{property.title}</Text>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.locationText}>{property.address}, {property.city}, {property.state}</Text>
          </TouchableOpacity>

          {/* ── Features Grid ── */}
          <View style={styles.featuresGrid}>
            {property.bedrooms != null && <FeatureItem icon="bed-outline" label="Bedrooms" value={String(property.bedrooms)} />}
            {property.bathrooms != null && <FeatureItem icon="water-outline" label="Bathrooms" value={String(property.bathrooms)} />}
            {property.toilets != null && <FeatureItem icon="flask-outline" label="Toilets" value={String(property.toilets)} />}
            {property.area != null && <FeatureItem icon="resize-outline" label="Area" value={`${property.area} sqm`} />}
            <FeatureItem icon="pricetag-outline" label="Type" value={property.type} />
            <FeatureItem icon="eye-outline" label="Views" value={String(property.viewCount)} />
          </View>

          {/* ── Description ── */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* ── Amenities ── */}
          {property.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Installment Plan Teaser ── */}
          <InstallmentTeaser property={property} />

          <View style={{ height: Spacing.xxxxl + 80 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.callBtn} activeOpacity={0.7}>
          <Ionicons name="call-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Button title="Contact Realtor" onPress={() => {}} variant="primary" size="lg" style={styles.ctaButton} icon={<Ionicons name="chatbubble-outline" size={18} color={Colors.white} />} />
      </View>
    </View>
  );
}

/* ────────── Sub-components ────────── */

function FeatureItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}><Ionicons name={icon} size={20} color={Colors.primary} /></View>
      <Text style={styles.featureValue}>{value}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

function InstallmentTeaser({ property }: { property: Property }) {
  return (
    <Card style={styles.installmentCard} variant="outlined">
      <LinearGradient colors={[Colors.primaryLight + '60', Colors.primaryLight + '20']} style={styles.installmentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={styles.installmentHeader}>
        <View style={styles.installmentBadge}>
          <Ionicons name="card-outline" size={16} color={Colors.primary} />
          <Text style={styles.installmentBadgeText}>Installment Available</Text>
        </View>
      </View>
      <Text style={styles.installmentDesc}>This property supports installment payments. Apply to view the full payment plan and schedule.</Text>
      <View style={styles.installmentPreview}>
        <View style={styles.installmentRow}>
          <Text style={styles.installmentLabel}>Total Price</Text>
          <Text style={styles.installmentValue}>{formatCurrency(property.price)}</Text>
        </View>
      </View>
      <ProgressBar progress={0} label="Payment Progress" showPercentage style={styles.progressBar} />
      <Button title="View Installment Plan" variant="outline" size="md" onPress={() => {}} style={styles.installmentButton} icon={<Ionicons name="arrow-forward" size={16} color={Colors.primary} />} iconPosition="right" />
    </Card>
  );
}

/* ────────── Styles ────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loaderContent: { alignItems: 'center', gap: Spacing.md },
  loaderText: { ...Typography.caption, color: Colors.textMuted },

  floatingHeader: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
  floatingRight: { flexDirection: 'row', gap: Spacing.sm },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, marginTop: -20, backgroundColor: Colors.background },

  priceRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  price: { ...Typography.h2, color: Colors.primary },
  priceLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },

  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl, gap: Spacing.sm },
  locationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  locationText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xxl },
  featureItem: { width: '31%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  featureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  featureValue: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  featureLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },

  descriptionSection: { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },

  amenitiesSection: { marginBottom: Spacing.xxl },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, gap: Spacing.xs },
  amenityText: { ...Typography.caption, color: Colors.success, fontWeight: '500' },

  installmentCard: { marginBottom: Spacing.xxl, position: 'relative', overflow: 'hidden' },
  installmentGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: BorderRadius.lg },
  installmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  installmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, gap: Spacing.xs },
  installmentBadgeText: { ...Typography.captionMedium, color: Colors.primary },
  installmentDesc: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },
  installmentPreview: { marginBottom: Spacing.md },
  installmentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  installmentLabel: { ...Typography.caption, color: Colors.textMuted },
  installmentValue: { ...Typography.captionMedium, color: Colors.textPrimary },
  progressBar: { marginBottom: Spacing.md },
  installmentButton: {},

  bottomCTA: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'center', ...Shadows.lg, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  callBtn: { width: 52, height: 52, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
  ctaButton: { flex: 1 },
});

