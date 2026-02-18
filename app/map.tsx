import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { propertyService } from '@/services/property.service';
import type { Property, PropertyAvailability } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;

// Default region (Lagos, Nigeria)
const DEFAULT_REGION: Region = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0922 * ASPECT_RATIO,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const result = await propertyService.search({
        availability: 'AVAILABLE',
        limit: 50,
      });
      setProperties(result.items || []);
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (property: Property) => {
    setSelectedProperty(property);
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/(client)/properties/${property.id}` as any);
  };

  const getMarkerColor = (availability: PropertyAvailability) => {
    switch (availability) {
      case 'AVAILABLE':
        return Colors.success;
      case 'SOLD':
        return Colors.error;
      case 'RESERVED':
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {properties.map((property) => {
          const lat = property.coordinates?.lat;
          const lng = property.coordinates?.lng;
          if (!lat || !lng) return null;

          return (
            <Marker
              key={property.id}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor={getMarkerColor(property.availability)}
              onPress={() => handleMarkerPress(property)}
            >
              <Callout onPress={() => handlePropertyPress(property)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <Text style={styles.calloutPrice}>
                    {formatCurrency(property.price)}
                  </Text>
                  <Text style={styles.calloutLocation}>
                    {property.city}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Map</Text>
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={() => {
            mapRef.current?.animateToRegion(DEFAULT_REGION, 500);
          }}
        >
          <Ionicons name="locate-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      )}

      {/* Property Count Badge */}
      {!isLoading && properties.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </Text>
        </View>
      )}

      {/* Selected Property Card */}
      {selectedProperty && (
        <TouchableOpacity
          style={styles.propertyCard}
          onPress={() => handlePropertyPress(selectedProperty)}
          activeOpacity={0.9}
        >
          <View style={styles.propertyCardContent}>
            <View style={styles.propertyCardInfo}>
              <Text style={styles.propertyCardTitle} numberOfLines={1}>
                {selectedProperty.title}
              </Text>
              <Text style={styles.propertyCardLocation} numberOfLines={1}>
                {selectedProperty.city}, {selectedProperty.state}
              </Text>
              <Text style={styles.propertyCardPrice}>
                {formatCurrency(selectedProperty.price)}
              </Text>
            </View>
            <View style={styles.propertyCardMeta}>
              {selectedProperty.bedrooms != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="bed-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>{selectedProperty.bedrooms}</Text>
                </View>
              )}
              {selectedProperty.bathrooms != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="water-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>{selectedProperty.bathrooms}</Text>
                </View>
              )}
              {selectedProperty.area != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="resize-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>{selectedProperty.area} sqm</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeCard}
            onPress={() => setSelectedProperty(null)}
          >
            <Ionicons name="close" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  myLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -30 }],
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  countBadge: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  countText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
  propertyCard: {
    position: 'absolute',
    bottom: Spacing.xxl + 40,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    ...Shadows.lg,
  },
  propertyCardContent: {
    flex: 1,
  },
  propertyCardInfo: {
    marginBottom: Spacing.sm,
  },
  propertyCardTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  propertyCardLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  propertyCardPrice: {
    ...Typography.h4,
    color: Colors.primary,
    marginTop: 2,
  },
  propertyCardMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  closeCard: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    minWidth: 150,
    maxWidth: 200,
    padding: 4,
  },
  calloutTitle: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
  },
  calloutPrice: {
    ...Typography.bodySemiBold,
    color: Colors.primary,
  },
  calloutLocation: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});
