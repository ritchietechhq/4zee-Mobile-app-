import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import favoritesService from '@/services/favorites.service';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { Property } from '@/types';

type ViewMode = 'list' | 'grid';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  const fetchFavorites = useCallback(async () => {
    try {
      setFetchError(null);
      const data = await favoritesService.list();
      setFavorites(data);
      setFavoriteIds(new Set(data.map(p => p.id)));
    } catch (err: any) {
      const errMsg =
        err?.error?.message || err?.message || 'Failed to load favourites';
      const errCode = err?.error?.code;
      if (__DEV__) console.warn('[Favourites] fetch error', errCode, errMsg);

      // If a deleted property is causing RESOURCE_NOT_FOUND, tell the user
      if (errCode === 'RESOURCE_NOT_FOUND') {
        setFetchError(
          'A saved property may have been removed by the owner. Pull down to refresh — this should resolve on its own.',
        );
      } else {
        setFetchError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch favourites every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites]),
  );

  useEffect(() => {
    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  const handleFavoriteChange = useCallback((propertyId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // Remove from local state immediately
      setFavorites(prev => prev.filter(p => p.id !== propertyId));
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  }, []);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View>
          <Text style={dynamicStyles.title}>Favourites</Text>
          <Text style={dynamicStyles.subtitle}>
            {isLoading ? 'Loading...' : fetchError ? 'Error loading favourites' : `${favorites.length} ${favorites.length === 1 ? 'property' : 'properties'} saved`}
          </Text>
        </View>
        <TouchableOpacity
          style={dynamicStyles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          activeOpacity={0.7}
        >
          <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && favorites.length === 0 ? (
        <View style={dynamicStyles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={dynamicStyles.skeletonItem}>
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
            contentContainerStyle={dynamicStyles.listContent}
            columnWrapperStyle={viewMode === 'grid' ? dynamicStyles.gridRow : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <View style={viewMode === 'grid' ? dynamicStyles.gridItem : dynamicStyles.listItem}>
                <PropertyCard 
                  property={item} 
                  variant={viewMode === 'grid' ? 'vertical' : 'horizontal'} 
                  isFavorite={favoriteIds.has(item.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              </View>
            )}
            ListEmptyComponent={
              fetchError ? (
                <EmptyState
                  icon="alert-circle-outline"
                  title="Couldn't load favourites"
                  description={`${fetchError}\n\nPull down to retry.`}
                />
              ) : (
                <EmptyState
                  icon="heart-outline"
                  title="No favourites yet"
                  description="Tap the heart icon on any property to add it to your favourites for quick access."
                />
              )
            }
            ListFooterComponent={<View style={{ height: Spacing.xxxxl }} />}
          />
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { ...Typography.h3, color: colors.textPrimary },
    subtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    viewToggle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl },
    listItem: { marginBottom: Spacing.sm },
    gridRow: { justifyContent: 'space-between' },
    gridItem: { width: '48%', marginBottom: Spacing.md },
    skeletonWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.md },
    skeletonItem: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: colors.border, ...Shadows.sm },
  });

