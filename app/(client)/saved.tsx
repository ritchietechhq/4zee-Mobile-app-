import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import favoritesService from '@/services/favorites.service';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { Property } from '@/types';

type ViewMode = 'list' | 'grid';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await favoritesService.list();
      setFavorites(data);
    } catch {
      // Silently fail — show empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Properties</Text>
          <Text style={styles.subtitle}>
            {isLoading ? 'Loading...' : `${favorites.length} ${favorites.length === 1 ? 'property' : 'properties'} saved`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          activeOpacity={0.7}
        >
          <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && favorites.length === 0 ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <Skeleton width={120} height={100} borderRadius={BorderRadius.lg} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Skeleton width="70%" height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            key={viewMode}
            data={favorites}
            numColumns={viewMode === 'grid' ? 2 : 1}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            renderItem={({ item }) => (
              <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
                <PropertyCard property={item} variant={viewMode === 'grid' ? 'vertical' : 'horizontal'} />
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="heart-outline"
                title="No saved properties"
                description="Properties you save will appear here for quick access. Start exploring to find your dream property!"
              />
            }
            ListFooterComponent={<View style={{ height: Spacing.xxxxl }} />}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  viewToggle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl },
  listItem: { marginBottom: Spacing.sm },
  gridRow: { justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: Spacing.md },
  skeletonWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.md },
  skeletonItem: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.sm },
});

