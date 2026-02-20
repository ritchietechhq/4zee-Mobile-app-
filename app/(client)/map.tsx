import React, { useEffect, useState, useMemo } from 'react';
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
import { useTheme } from '@/hooks/useTheme';
import { PropertyCard } from '@/components/property/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Property } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { properties, isLoading, searchProperties } = usePropertyStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => { if (properties.length === 0) searchProperties(); }, []);

  const selectedProperty = properties.find((p) => p.id === selectedId);

  /* ── List view ── */
  if (showList) {
    return (
      <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
        <View style={dynamicStyles.listHeader}>
          <View>
            <Text style={dynamicStyles.listTitle}>All Properties</Text>
            <Text style={dynamicStyles.listSubtitle}>{properties.length} listings</Text>
          </View>
          <TouchableOpacity style={dynamicStyles.toggleBtn} onPress={() => setShowList(false)} activeOpacity={0.7}>
            <Ionicons name="map-outline" size={18} color={colors.primary} />
            <Text style={dynamicStyles.toggleText}>Map</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerStyle={dynamicStyles.listContent}
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
    <View style={dynamicStyles.container}>
      {/* Map placeholder */}
      <View style={dynamicStyles.mapPlaceholder}>
        <View style={dynamicStyles.mapGrid}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View key={i} style={[dynamicStyles.mapGridCell, i % 3 === 0 && { backgroundColor: colors.primaryLight + '40' }]} />
          ))}
        </View>
        <View style={dynamicStyles.mapCenterContent}>
          <View style={dynamicStyles.mapIconWrap}>
            <Ionicons name="map" size={40} color={colors.primary} />
          </View>
          <Text style={dynamicStyles.mapPlaceholderTitle}>Map View</Text>
          <Text style={dynamicStyles.mapPlaceholderDesc}>
            {isLoading ? 'Loading properties...' : `${properties.length} properties available`}
          </Text>
          {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.md }} />}
        </View>
      </View>

      {/* Top controls */}
      <View style={[dynamicStyles.topControls, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={dynamicStyles.mapControlBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={dynamicStyles.topRight}>
          <TouchableOpacity style={dynamicStyles.mapControlBtn} onPress={() => setShowList(true)}>
            <Ionicons name="list-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Property Pins */}
      {!isLoading && properties.length > 0 && (
        <View style={dynamicStyles.pinGrid}>
          {properties.slice(0, 12).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[dynamicStyles.pin, selectedId === p.id && dynamicStyles.pinSelected]}
              onPress={() => setSelectedId(selectedId === p.id ? null : p.id)}
              activeOpacity={0.8}
            >
              <Text style={[dynamicStyles.pinText, selectedId === p.id && dynamicStyles.pinTextSelected]}>
                {formatCurrency(p.price).replace('NGN', '₦').slice(0, 8)}
              </Text>
              {selectedId === p.id && <View style={dynamicStyles.pinArrow} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom preview card */}
      {selectedProperty && (
        <View style={[dynamicStyles.previewSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={dynamicStyles.previewCard}
            activeOpacity={0.9}
            onPress={() => router.push(`/properties/${selectedProperty.id}`)}
          >
            <Image
              source={{ uri: selectedProperty.images?.[0] }}
              style={dynamicStyles.previewImage}
              contentFit="cover"
              placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              transition={200}
            />
            <View style={dynamicStyles.previewInfo}>
              <Text style={dynamicStyles.previewPrice}>{formatCurrency(selectedProperty.price)}</Text>
              <Text style={dynamicStyles.previewTitle} numberOfLines={1}>{selectedProperty.title}</Text>
              <View style={dynamicStyles.previewLocation}>
                <Ionicons name="location" size={13} color={colors.primary} />
                <Text style={dynamicStyles.previewLocationText} numberOfLines={1}>{selectedProperty.city}, {selectedProperty.state}</Text>
              </View>
              <View style={dynamicStyles.previewFeatures}>
                {selectedProperty.bedrooms != null && (
                  <View style={dynamicStyles.previewFeature}>
                    <Ionicons name="bed-outline" size={14} color={colors.textMuted} />
                    <Text style={dynamicStyles.previewFeatureText}>{selectedProperty.bedrooms}</Text>
                  </View>
                )}
                {selectedProperty.bathrooms != null && (
                  <View style={dynamicStyles.previewFeature}>
                    <Ionicons name="water-outline" size={14} color={colors.textMuted} />
                    <Text style={dynamicStyles.previewFeatureText}>{selectedProperty.bathrooms}</Text>
                  </View>
                )}
                {selectedProperty.area != null && (
                  <View style={dynamicStyles.previewFeature}>
                    <Ionicons name="resize-outline" size={14} color={colors.textMuted} />
                    <Text style={dynamicStyles.previewFeatureText}>{selectedProperty.area} sqm</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={dynamicStyles.previewChevron}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, overflow: 'hidden' },
    mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' },
    mapGridCell: { width: '20%', height: 60, borderWidth: 0.5, borderColor: colors.border + '50' },
    mapCenterContent: { alignItems: 'center', zIndex: 2 },
    mapIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, ...Shadows.md },
    mapPlaceholderTitle: { ...Typography.h4, color: colors.textPrimary },
    mapPlaceholderDesc: { ...Typography.caption, color: colors.textMuted, marginTop: Spacing.xs },
    topControls: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
    topRight: { flexDirection: 'row', gap: Spacing.sm },
    mapControlBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadows.md, borderWidth: 1, borderColor: colors.border },
    pinGrid: { position: 'absolute', top: '25%', left: Spacing.xl, right: Spacing.xl, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, zIndex: 5 },
    pin: { backgroundColor: colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full, ...Shadows.md, borderWidth: 2, borderColor: colors.border },
    pinSelected: { backgroundColor: colors.primary, borderColor: colors.primary, transform: [{ scale: 1.1 }] },
    pinText: { ...Typography.small, color: colors.textPrimary, fontWeight: '600' },
    pinTextSelected: { color: colors.white },
    pinArrow: { position: 'absolute', bottom: -6, alignSelf: 'center', left: '50%', marginLeft: -5, width: 10, height: 10, backgroundColor: colors.primary, transform: [{ rotate: '45deg' }] },
    previewSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, zIndex: 10 },
    previewCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.lg, borderWidth: 1, borderColor: colors.border },
    previewImage: { width: 110, height: 120 },
    previewInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
    previewPrice: { ...Typography.bodySemiBold, color: colors.primary },
    previewTitle: { ...Typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    previewLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
    previewLocationText: { ...Typography.small, color: colors.textMuted, flex: 1 },
    previewFeatures: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
    previewFeature: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    previewFeatureText: { ...Typography.small, color: colors.textMuted },
    previewChevron: { justifyContent: 'center', paddingRight: Spacing.md },
    listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    listTitle: { ...Typography.h3, color: colors.textPrimary },
    listSubtitle: { ...Typography.caption, color: colors.textMuted, marginTop: 2 },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.primaryLight },
    toggleText: { ...Typography.captionMedium, color: colors.primary },
    listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl },
  });

