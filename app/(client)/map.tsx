import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { usePropertyStore } from '@/store/property.store';
import { PropertyCard } from '@/components/property/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Property } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { properties, isLoading, searchProperties } = usePropertyStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  useEffect(() => { if (properties.length === 0) searchProperties(); }, []);

  const selectedProperty = properties.find((p) => p.id === selectedId);

  /* ── List view ── */
  if (showList) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>All Properties</Text>
            <Text style={styles.listSubtitle}>{properties.length} listings</Text>
          </View>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowList(false)} activeOpacity={0.7}>
            <Ionicons name="map-outline" size={18} color={Colors.primary} />
            <Text style={styles.toggleText}>Map</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyCard property={item} variant="horizontal" />}
          ListEmptyComponent={<EmptyState icon="map-outline" title="No properties" description="No properties available to display." />}
          ListFooterComponent={<View style={{ height: Spacing.xxxxl }} />}
        />
      </View>
    );
  }

  /* ── Map view ── */
  return (
    <View style={styles.container}>
      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View key={i} style={[styles.mapGridCell, i % 3 === 0 && { backgroundColor: Colors.primaryLight + '40' }]} />
          ))}
        </View>
        <View style={styles.mapCenterContent}>
          <View style={styles.mapIconWrap}>
            <Ionicons name="map" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.mapPlaceholderTitle}>Map View</Text>
          <Text style={styles.mapPlaceholderDesc}>
            {isLoading ? 'Loading properties...' : `${properties.length} properties available`}
          </Text>
          {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />}
        </View>
      </View>

      {/* Top controls */}
      <View style={[styles.topControls, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.mapControlBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.mapControlBtn} onPress={() => setShowList(true)}>
            <Ionicons name="list-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Property Pins */}
      {!isLoading && properties.length > 0 && (
        <View style={styles.pinGrid}>
          {properties.slice(0, 12).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.pin, selectedId === p.id && styles.pinSelected]}
              onPress={() => setSelectedId(selectedId === p.id ? null : p.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pinText, selectedId === p.id && styles.pinTextSelected]}>
                {formatCurrency(p.price).replace('NGN', '₦').slice(0, 8)}
              </Text>
              {selectedId === p.id && <View style={styles.pinArrow} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom preview card */}
      {selectedProperty && (
        <View style={[styles.previewSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={styles.previewCard}
            activeOpacity={0.9}
            onPress={() => router.push(`/properties/${selectedProperty.id}`)}
          >
            <Image
              source={{ uri: selectedProperty.images?.[0] }}
              style={styles.previewImage}
              contentFit="cover"
              placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              transition={200}
            />
            <View style={styles.previewInfo}>
              <Text style={styles.previewPrice}>{formatCurrency(selectedProperty.price)}</Text>
              <Text style={styles.previewTitle} numberOfLines={1}>{selectedProperty.title}</Text>
              <View style={styles.previewLocation}>
                <Ionicons name="location" size={13} color={Colors.primary} />
                <Text style={styles.previewLocationText} numberOfLines={1}>{selectedProperty.city}, {selectedProperty.state}</Text>
              </View>
              <View style={styles.previewFeatures}>
                {selectedProperty.bedrooms != null && (
                  <View style={styles.previewFeature}>
                    <Ionicons name="bed-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.previewFeatureText}>{selectedProperty.bedrooms}</Text>
                  </View>
                )}
                {selectedProperty.bathrooms != null && (
                  <View style={styles.previewFeature}>
                    <Ionicons name="water-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.previewFeatureText}>{selectedProperty.bathrooms}</Text>
                  </View>
                )}
                {selectedProperty.area != null && (
                  <View style={styles.previewFeature}>
                    <Ionicons name="resize-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.previewFeatureText}>{selectedProperty.area} sqm</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.previewChevron}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, overflow: 'hidden' },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' },
  mapGridCell: { width: '20%', height: 60, borderWidth: 0.5, borderColor: Colors.borderLight + '50' },
  mapCenterContent: { alignItems: 'center', zIndex: 2 },
  mapIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, ...Shadows.md },
  mapPlaceholderTitle: { ...Typography.h4, color: Colors.textPrimary },
  mapPlaceholderDesc: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },

  topControls: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  topRight: { flexDirection: 'row', gap: Spacing.sm },
  mapControlBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },

  pinGrid: { position: 'absolute', top: '25%', left: Spacing.xl, right: Spacing.xl, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, zIndex: 5 },
  pin: { backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full, ...Shadows.md, borderWidth: 2, borderColor: 'transparent' },
  pinSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary, transform: [{ scale: 1.1 }] },
  pinText: { ...Typography.small, color: Colors.textPrimary, fontWeight: '600' },
  pinTextSelected: { color: Colors.white },
  pinArrow: { position: 'absolute', bottom: -6, alignSelf: 'center', left: '50%', marginLeft: -5, width: 10, height: 10, backgroundColor: Colors.primary, transform: [{ rotate: '45deg' }] },

  previewSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, zIndex: 10 },
  previewCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.lg, borderWidth: 1, borderColor: Colors.borderLight },
  previewImage: { width: 110, height: 120 },
  previewInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  previewPrice: { ...Typography.bodySemiBold, color: Colors.primary },
  previewTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginTop: 2 },
  previewLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  previewLocationText: { ...Typography.small, color: Colors.textMuted, flex: 1 },
  previewFeatures: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  previewFeature: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  previewFeatureText: { ...Typography.small, color: Colors.textMuted },
  previewChevron: { justifyContent: 'center', paddingRight: Spacing.md },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  listTitle: { ...Typography.h3, color: Colors.textPrimary },
  listSubtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryLight },
  toggleText: { ...Typography.captionMedium, color: Colors.primary },
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl },
});

